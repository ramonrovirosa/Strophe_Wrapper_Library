

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
    receiveMessage : function(msg){
        Chat.log("message received: ",msg);
        var to = msg.getAttribute('to');
        var from = msg.getAttribute('from');
        var type = msg.getAttribute('type');
        var elems = msg.getElementsByTagName('body');
        if(elems.length > 0){
            var body = elems[0];
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
        // to ramon@localhost
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
