

var Chat = {
    BOSH_SERVICE: 'http://localhost:5280/http-bind',
    connection: null,
    connected:false,
    debuggingMode:false,

    connect : function(jid,password,BOSH_SERVICE,debugginMode) {
        Chat.BOSH_SERVICE = (BOSH_SERVICE) ? BOSH_SERVICE : Chat.BOSH_SERVICE;
        Chat.debuggingMode = (debugginMode) ? debugginMode : true; //set to false after done testing!!
        Chat.connection = new Strophe.Connection(Chat.BOSH_SERVICE);
        Chat.connection.connect(jid,password, Chat.onConnect);
    },
    disconnect : function(){
        Chat.connection.flush();
        Chat.connection.disconnect();
        Chat.connected = false;
    },
    onConnect : function(status){
        if (status === Strophe.Status.CONNECTING) {
            Chat.log('Strophe is connecting.');
        }
        else if (status === Strophe.Status.CONNFAIL) {
            Chat.log('Strophe failed to connect.');
        }
        else if (status === Strophe.Status.DISCONNECTING) {
            Chat.log('Strophe is disconnecting.');
        }
        else if (status === Strophe.Status.DISCONNECTED) {
            Chat.log('Strophe is disconnected.');
        }
        else if (status === Strophe.Status.CONNECTED) {
            Chat.log('Strophe is connected.');
            Chat.connected = true;
            Chat.sendPresence();
            Chat.connection.addHandler(Chat.receiveMessage,null,'message');
            //Add ping handler ~noy working...
            //Chat.connection.ping.addPingHandler(Chat.receivePing);
            //getRoster from server
            var iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
            Chat.connection.sendIQ(iq, Chat.rosterReceived);
        }
    },
    sendPriority : function(priority){
        Chat.connection.send($pres()
            .c("priority").t(priority));
        Chat.log("Priority of " + priority + " sent to contacts.");
    },
    sendPresence : function(){
        Chat.connection.send($pres());
        Chat.log("Presence Sent.");
    },
    messages : [],
    chatStates:{},
    receiveMessage : function(msg){
        Chat.log("message received: ",msg);
        var to = msg.getAttribute('to');
        var from = msg.getAttribute('from');
        var type = msg.getAttribute('type');
        //var elems = msg.getElementsByTagName('body');

        if(msg.getElementsByTagName('paused').length){
            Chat.log("Sender is Paused");
            Chat.chatStates[from] = "paused";
        }
        if(msg.getElementsByTagName('active').length){
            Chat.log("Sender is Active");
            Chat.chatStates[from] = "active" ;
        }
        if(msg.getElementsByTagName('composing').length){
            Chat.log("Sender is composing");
            Chat.chatStates[from] = "composing"
        }
        if(msg.getElementsByTagName('body').length){
            var body = msg.getElementsByTagName('body')[0];
            var messageInfo = {
                'to' : to,
                'from': from,
                'type': type,
                'message': Strophe.getText(body)
            }
            Chat.messages.push(messageInfo);
        }
        // we must return true to keep the handler alive.
        // returning false would remove it after it finishes.
        return true;
    },
    sendMessage : function(messgeTo,message){
        var reply = $msg({to: messgeTo, from: Chat.connection.jid, type: 'chat'})
            .c("body").t(message);
        //You are connected & can send a message
        if(Chat.connected == true  ) {
            Chat.connection.send(reply.tree());
            Chat.log('I sent ' + messgeTo + ': ' + message);
        }else { //not connected, cannot send message.
            Chat.log("Message not sent, not connected!")
        }
    },
    Roster : [],
    getRoster : function(){
             if(!Chat.Roster){
                 Chat.log("Roster Items not yet loaded!/No Contacts");
             }
            else
              return Chat.Roster;
    },
    rosterReceived: function(iq){
        Chat.log(iq);
        $(iq).find("item").each(function() {
             Chat.Roster.push({jid:$(this).attr('jid'),
                          name:$(this).attr('name'),
                          subscription:$(this).attr('subscription')
             });
        });
        Chat.connection.addHandler(Chat.presenceReceived,null,"presence");
    },
    //A list of all the contacts online
    presenceMessage : {},
    presenceReceived : function(presence){
        var presence_type = $(presence).attr('type'); // unavailable, subscribed, etc...
        var from = $(presence).attr('from'); // the jabber_id of the contact...
        if(!Chat.presenceMessage[from])
            Chat.log(presence);
        if (presence_type != 'error'){
            if (presence_type === 'unavailable'){
                Chat.log("Contact: ", $(presence).attr('from'), " is offline");
                Chat.presenceMessage[from] = "offline";
            }else{
                var show = $(presence).find("show").text(); // this is what gives away, dnd, etc.
                if ( (show === 'chat' || show === '') && (!Chat.presenceMessage[from])){
                    // Mark contact as online
                    Chat.log("Contact: ", $(presence).attr('from'), " is online");
                    Chat.presenceMessage[from] = "online";
                    Chat.sendPresence();
                } else if (show === 'away'){
                    Chat.log("Contact: ", $(presence).attr('from'), " is offline");
                    Chat.presenceMessage[from] = "offline";
                }
            }
        }

        return true;
    },
    sendChatState:function(Jid,status,type){
        var chatType = (type) ? type : "chat";
        if(Chat.connection && Jid){
            Chat.connection.chatstates.init(Chat.connection);
            if(status === "active" ){
                Chat.connection.chatstates.sendActive(Jid,chatType);
            }else if(status === "composing"){
                Chat.connection.chatstates.sendComposing(Jid,chatType);
            }else if(status === "paused"){
                Chat.connection.chatstates.sendPaused(Jid,chatType);
            }else
                Chat.log("Error, try again");

        }else{
            Chat.log("Error,sorry not connected")
        }

    },
    discoSuccess : {},
    discoInfo: function(Jid){
        Chat.connection.disco.info(Jid,'',
            //Success callback
            function(status){Chat.log("Disc Info Success",status);
                Chat.discoSuccess[Jid] = true;},
            //error callback
            function(status){Chat.log("Disc Info Error",status);
                Chat.discoSuccess[Jid] = false;}
        );
    },
    Pings : {},
    ping : function(Jid){
      Chat.connection.ping.ping(Jid,
          function(status){
             Chat.log("Ping Success",status);
             Chat.Pings[Jid] = true;
          },
          function(status){
              Chat.log("Ping Error",status);
              Chat.Pings[Jid] = false;
          }
      );
    },
//    receivePing : function(ping){
//        Chat.log("Ping received!");
//        Chat.connection.ping.pong( ping );
//        return true;
//    },
    log: function(){
        //If not connected
        if(!Chat.connection){
            console.log("Error, not connected`, please enter credentials:\n " +
                "Chat.connect('jid','password')");
        }
        if(Chat.debuggingMode){
            for(var i=0;i<arguments.length;i++){
                console.log(arguments[i]);
            }
        }
    },
    getSubJID: function(Jid){
        //for parsing JID: ramon@localhost/1234567
        // becomes...
        // ramon@localhost
        var subJID='';
        for(i=0;i<Jid.length;i++){
            if(Jid[i] === '/'){
                if(Chat.connected)Chat.log(Jid + " => " + subJID);
                return subJID;
            }
            subJID+=Jid[i];
        }
        return subJID;
    }
}
