var params, chatUser, chatService, recipientID, chatType;


function setLoading(show){
	if (show) {
		$("#waitdlg").modal({ backdrop: "static" });
	} else {
		$("#waitdlg").modal("hide");
	}
}

function login(_login,_password) {
	$("#load-chat-history").prop("checked", true);
	
	params = {
		login: _login,
		password: _password
	};
	
	// chat user authentication
	QB.login(params, function(err, result) {
		if (err) {
			onConnectFailed();
			console.log(err.detail);
		} else {
			chatUser = {
				id: result.id,
				login: params.login,
				pass: params.password
			};
			
			connectChat();
		}
	});
}

function connectChat() {
	// set parameters of Chat object
	params = {
		onConnectFailed: onConnectFailed,
		onConnectSuccess: onConnectSuccess,
		onConnectClosed: onConnectClosed,
		onChatMessage: onChatMessage,
		onChatState: onChatState,

		debug: false
	};
	
	chatService = new QBChat(params);
	
	// connect to QB chat service
	chatService.connect(chatUser);
}

function startTyping() {
	if (chatUser.isTyping) return true;
	
	var message = {
		state: 'composing',
		type: 'chat',
		extension: {
			nick: chatUser.login
		}
	};
	
	// send 'composing' as chat state notification
	chatService.sendMessage(recipientID, message);
	
	chatUser.isTyping = true;
	setTimeout(stopTyping, 5 * 1000);
}

function stopTyping() {
	if ((!chatUser) || (!chatUser.isTyping)) return true;
	
	var message = {
		state: 'paused',
		type: 'chat',
		extension: {
			nick: chatUser.login
		}
	};
	
	// send 'paused' as chat state notification
	chatService.sendMessage(recipientID, message);
	
	chatUser.isTyping = false;
}

function makeMessage(event) {
	event.preventDefault();
	var file, text;
	
	file = $('input:file')[0].files[0];
	text = $('.chat input:text').val();
	
	// check if user did not leave the empty field
	if (trim(text)) {
		
		// check if user has uploaded file
		if (file) {
			$('.chat .input-group').hide();
			$('.file-loading').show();
			closeFile();
			
			QB.content.createAndUpload({file: file, 'public': true}, function(err, result) {
				if (err) {
					console.log(err.detail);
				} else {
					$('.file-loading').hide();
					$('.chat .input-group').show();
					sendMessage(text, result.name, result.uid);
				}
			});
		} else {
			sendMessage(text);
		}
	}
}

function sendMessage(text, fileName, fileUID) {
	stopTyping();
	
	var message = {
		body: text,
		type: 'chat',
		extension: {
			nick: chatUser.login,
			save_to_history: 1
		}
	};
	
	if (fileName && fileUID) {
		message.extension.fileName = fileName;
		message.extension.fileUID = fileUID;
	}
	
	// send user message
	chatService.sendMessage(recipientID, message);
	
	showMessage(message.body, new Date().toISOString(), message.extension);
	$('.chat input:text').val('');
}

function showMessage(body, time, extension) {
	var html, url, selector = $('.chat .messages');
	
	html = '<section class="message">';
	html += '<header><b>' + extension.nick + '</b>';
	html += '<time datetime="' + time + '">' + $.timeago(time) + '</time></header>';
	html += '<div class="message-description">' + QBChatHelpers.parser(body) + '</div>';
	
	// get attached file
	if (extension.fileName && extension.fileUID) {
		url = QBChatHelpers.getLinkOnFile(extension.fileUID);
		html += '<footer class="message-attach"><span class="glyphicon glyphicon-paperclip"></span> ';
		html += '<a href="' + url + '" target="_blank">' + extension.fileName + '</a></footer>';
	}
	
	html += '</section>';
	
	if ($('.typing-message')[0])
		$('.typing-message').before(html);
	else
		selector.append(html);
	
	selector.find('.message:even').addClass('white');
	selector.scrollTo('*:last', 0);
}

function logout() {
	// close the connection
	chatService.disconnect();
}

function showChatBox(){
	$('#wraphistory').hide();
	$('#wrap').show();
	$('.panel-title .opponent').text(_OPPONENTUSERID);
	$('.chat .chat-user-list').html('<li class="list-group-item"><span class="glyphicon glyphicon-user"></span> ' + _OPPONENTUSERID + '</li>');		
	
	$('.chat input:text').focus().val('');
	changeHeightChatBlock();
	
	recipientID = _OPPONENTUSERID;
	
	// create a timer that will send presence each 60 seconds
	chatService.startAutoSendPresence(60);
}

function _onMessages(err, res){
	if (!err) {
		$('.chat .messages').empty();
		$.each(res.items, function(i, obj){
			if (obj.message) {
				var message = {
					body: obj.message,
					type: 'chat',
					datetime: new Date(obj.date_sent*1000),
					extension: {
						nick: obj.nick
					}
				};			
				
				// TODO: display attachments
				/*
				if ((obj.attachments.length) && (fileUID)) {
					message.extension.fileName = fileName;
					message.extension.fileUID = fileUID;
				}
				*/
				
				// function showMessage(body, time, extension) {
				showMessage(message.body, message.datetime.toISOString(), message.extension);
			}
		});
		
		showChatBox();
	}
}

function _onDialogs(err, res){
	
	if (!err) {		

		$("#history-list").on("change", function(e){
			$("#load-chat-history-wrapper").show();		
		});
		
		$("#startChat").on("click", function(e){
			var $options = $("#history-list option:selected"),
				dlg_id = $options.data("dialogId");
			
			var loadHistory = $("#load-chat-history").prop("checked");
			if (loadHistory) {
				QB.chat.message.list({chat_dialog_id: dlg_id}, _onMessages);
			} else {
				$('.chat .messages').empty();
				showChatBox();
			}
		});
		
		var optsStr = "";
		$.each(res.items, function(i, obj){
			var occupantsIds = $.grep(obj.occupants_ids, function(id){
				return id != obj.user_id;
			});
			optsStr = "Users: " + occupantsIds.join(",");
			optsStr = optsStr + " -> Last Message: " + obj.last_message;
			var $option =  $("<option></option>").text(optsStr).data("dialogId",obj._id);
			$("#history-list").append($option);

			$("select#history-list").prop('selectedIndex', 0);

			$( "#startChat" ).trigger( "click" );
		});
	
		
	} // err
}

function getAllDialogsCurrUser(){
	QB.chat.dialog.list({limit: 50}, _onDialogs);
}

/* Callbacks
----------------------------------------------------------*/
function onConnectFailed() {
	setLoading(false);
}

function onConnectSuccess() {
	setLoading(false);
	$('#wraphistory').show();
	$('.currentUser','#wraphistory').text(chatUser.login);
		
	// get all dialogs of current user
	getAllDialogsCurrUser();	
}

function onConnectClosed() {
	var location = window.location.pathname.split("/").slice(0,-1);
	location = window.location.origin + location.join("/");
	window.location.href = location + '/index.html';
	chatUser = null;
	chatService = null;
}

function onChatMessage(senderID, message) {
	showMessage(message.body, message.time, message.extension);
}

function onChatState(senderID, message) {
	switch (message.state) {
	case 'composing':
		$('.chat .messages').append('<div class="typing-message">' + message.extension.nick + ' ...</div>');
		$('.chat .messages').scrollTo('*:last', 0);
		break;
	case 'paused':
		QBChatHelpers.removeTypingMessage($('.typing-message'), message.extension.nick);
		break;
	}
}
