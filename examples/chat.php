<?php
    $username = $_REQUEST['username'];
    $pwd = $_REQUEST['pwd'];
    $OppId = $_REQUEST['opid'];

    if (!isset($username) || !isset($pwd)){
        die("Invalid username or password!");
    }

    include('config.php');

echo '
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<title>QB Web Chat sample - One to One chat</title>
	
	<link rel="stylesheet" href="http://netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css">
	<link rel="stylesheet" href="../css/styles.css">
</head>
<body>
	<section id="waitdlg" class="modal fade">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h3 class="modal-title">Loading..</h3>
				</div>
				<div class="modal-body">
					<p>Please wait...</p>
				</div>
			</div>
		</div>
	</section>

	<section id="wraphistory">		
		<div class="panel panel-primary">
			<div class="panel-heading">
				<h3 class="panel-title">Chat history of <span class="currentUser"></span></h3>
			</div>
			<div class="chat panel-body">
				<select id="history-list" size="20"></select>				
				<button type="button" id="startChat">Chat</button>				
				<div id="load-chat-history-wrapper"><input id="load-chat-history" type="checkbox" value="loadchat" /> Load Chat History</div>
			</div>
		</div>
	</section>
	<section id="wrap">
		<div class="panel panel-primary">
			<div class="panel-heading">
				<h3 class="panel-title">Private chat with <span class="opponent"></span></h3>
				<button type="button" id="logout" class="btn tooltip-title" data-toggle="tooltip" data-placement="bottom" title="Exit">
					<span class="glyphicon glyphicon-log-out"></span>
				</button>
			</div>
			<div class="chat panel-body">
				<ul class="chat-user-list list-group"></ul>
				<div class="chat-content">
					<div class="messages"></div>
					<form action="#" class="controls">
						<div class="input-group">
							<span class="uploader input-group-addon">
								<span class="glyphicon glyphicon-file"></span>
								<input type="file" class="tooltip-title" data-toggle="tooltip" data-placement="right" title="Attach file">
								<div class="attach"></div>
							</span>
							<input type="text" class="form-control" placeholder="Enter your message here..">
							<span class="input-group-btn">
								<button type="submit" class="sendMessage btn btn-primary">Send</button>
							</span>
						</div>
						<div class="file-loading bg-warning">
							<img src="../images/file-loading.gif" alt="loading">
							Please wait.. File is loading
						</div>
					</form>
				</div>
			</div>		
		</div><!-- .panel -->
	</section><!-- #wrap -->
	<script src="http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js"></script>
	<script src="http://netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min.js"></script>
	
	<script src="../libs/quickblox.js"></script>
	<script src="../libs/quickblox.chat.js"></script>
	<script src="../libs/jquery.timeago.js"></script>
	<script src="../libs/jquery.scrollTo-min.js"></script>
	
	<script src="../config.js"></script>
	<script src="../js/helpers.js"></script>
	<script src="chat.js"></script>

	<script>
        var _OPPONENTUSERID = '.$OppId.';
        $(document).ready(function() {
            // Web SDK initialization
            QB.init("'.$QBAPPID.'", "'.$QBAPPAuthKey.'", "'.$QBAPPAuthSecret.'");
            
            // QuickBlox session creation
            QB.createSession(function(err, result) {
                if (err) {
                    console.log(err.detail);
                } else {                    
					setLoading(true);
										
                    $(".tooltip-title").tooltip();
                    changeInputFileBehavior();
                    updateTime();
					
                    // events
                    login("'.$username.'","'.$pwd.'");
                    $("#logout").click(logout);
                    $(".attach").on("click", ".close", closeFile);
                    $(".chat input:text").keydown(startTyping);
                    $(".sendMessage").click(makeMessage);
                }
            });
            
            window.onresize = function() {
                changeHeightChatBlock();
            };

        });

	</script>

</body>
</html>
';

?>