/**
 * Ramon Rovirsa
 * Strophe.js: http://strophe.im/strophejs/
**/
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
            //GetPubSub Nodes
            Chat.discoverNodes();
            //getNodes user is subscribed to
            Chat.getSubscriptions();
        }
    },
    onRegister : function(status){
        if (status === Strophe.Status.REGISTER) {
            Chat.log("Registering");
            Chat.connection.register.fields.username =Chat.registerUserInfo.Jid;
            Chat.connection.register.fields.password = Chat.registerUserInfo.Password;
            Chat.connection.register.submit();
        } else if (status === Strophe.Status.REGISTERED) {
            Chat.log("Registered!");
            Chat.connection.authenticate();
        } else if (status === Strophe.Status.CONNECTED) {
            Chat.log("logged in!");
        } else {
            // every other status a connection.connect would receive
        }
    },
    registerUserInfo:{},
    registerUser : function(server,Jid,Password,BOSH_SERVICE){
        //XEP-0077 InBand Registration
        Chat.registerUserInfo = {'Jid':Jid,'Password' : Password};
        //possibly more reg fields later... email,name

        Chat.connection = true;
        Chat.debuggingMode = true;
        Chat.BOSH_SERVICE = (BOSH_SERVICE) ? BOSH_SERVICE : Chat.BOSH_SERVICE;
        Chat.connection = new Strophe.Connection(Chat.BOSH_SERVICE);
        Chat.connection.register.connect(server, Chat.onRegister);
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

        //GroupChat message
        if(type == 'groupchat'){
            Chat.log("Group Chat message");
        }

        //pubsub message
        else if(from === Chat.pubsubJid && msg.getElementsByTagName('summary').length){
            Chat.log("pubsub message",msg.getElementsByTagName('summary')[0]);
            var items = msg.getElementsByTagName('items');
            var nodeName = items[0].getAttribute('node');
            Chat.pubsubMessages.push({
                "message" : Strophe.getText(msg.getElementsByTagName('summary')[0]),
                "type"    : "received",
                "nodeName"    : nodeName
            });
        }
        else if(msg.getElementsByTagName('paused').length){
            Chat.log("Sender is Paused");
            Chat.chatStates[from] = "paused";
        }
        else if(msg.getElementsByTagName('active').length){
            Chat.log("Sender is Active");
            Chat.chatStates[from] = "active" ;
        }
        else if(msg.getElementsByTagName('composing').length){
            Chat.log("Sender is composing");
            Chat.chatStates[from] = "composing"
        }
        else if(msg.getElementsByTagName('body').length){
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
    //add user to your roster
    addUser:function(Jid, name, groups){
        if(!Chat.userExists(Jid)){
           var groups = (groups) ? groups : '';
           Chat.connection.roster.add(Jid,name,groups,function(status){
               Chat.Roster.push({'jid':Jid,
                   'name':name,
                   subscription: '' //NOTE:MIGHT BE ERROR PRONE TO NOT DECLARE SUBSCRIPTION...
               });
               Chat.log("User Added to roster: " + name,status,Chat.Roster);
           });
           Chat.log("Added user: "+ Jid);
        } else
            Chat.log("Error adding new User");
    },
    //remove user from your roster
    removeUser:function(Jid){
        if(Chat.userExists(Jid)){
            //Chat.connection.roster.get();
            var iq = $iq({type: 'set'}).c('query', {xmlns: Strophe.NS.ROSTER}).c('item', {jid: Jid,
                subscription: "remove"});
            Chat.connection.sendIQ(iq, function(status){
                Chat.log("Removed: "+Jid, status);
            });
            for(var i = Chat.Roster.length - 1; i >= 0; i--) {
                if(Chat.Roster[i].jid === Jid) {
                    Chat.Roster.splice(i, 1);
                    Chat.log(Chat.Roster);
                }
            }
        }else
            Chat.log("Error removing user");
    },
    authorizeUser:function(Jid,message){
        if(Chat.userExists(Jid)){
            Chat.connection.roster.authorize(Jid,message);
            Chat.log("Authorized: "+ Jid);
        }else
            Chat.log("Error Authorizing");
    },
    unauthorizeUser:function(Jid,message){
        if(Chat.userExists(Jid)){
            Chat.connection.roster.unauthorize(Jid,message);
            Chat.log("Unauthorized: "+ Jid);
        } else
            Chat.log("Error Unauthorizing");

    },
    subscribeUser:function(Jid,message){
        if(Chat.userExists(Jid)){
        Chat.connection.roster.subscribe(Jid,message);
        //May not need, but added anyways.
        Chat.Roster.push({'jid': Jid,
            'name': Jid,
            subscription: '' //NOTE:MIGHT BE ERROR PRONE TO NOT DECLARE SUBSCRIPTION...
        });
        Chat.log("Subscribed: "+Jid);
        }else
            Chat.log("Error subscribing user");
    },
    unsubscribeUser:function(Jid,message){
        if(Chat.userExists(Jid)){
            Chat.connection.roster.unsubscribe(Jid,message);
            Chat.log("Unsubscribed: "+Jid);
        }else
            Chat.log("Error unsubscribing");
    },
    userExists:function(Jid){
        for(var i = Chat.Roster.length - 1; i >= 0; i--) {
            if(Chat.Roster[i].jid === Jid) {
                return true;
            }
        }
        return false;
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
    discoverNodes: function(){
         Chat.connection.pubsub.discoverNodes(
             function(iq){
                 $(iq).find("item").each(function() {
                     Chat.pubsubNodes.push($(this).attr('node'));
                     if(!Chat.pubsubJid){
                         Chat.pubsubJid = $(this).attr('jid');
                     }
                 });
                 Chat.log("success retreiving nodes, stored in array Chat.pubsubNodes",iq);
             },
             function(status){Chat.log("error",status)}
         );
    },
    pubsubNodes:[],
    pubsubJid:false,
    pubsubMessages:[],
    //nodeArray
    createNode: function(nodeName,options){
        var options=(options)? options : {};
        Chat.connection.pubsub.createNode(
            nodeName,
            options,
            function(status){
                Chat.log("Node created",status);
                Chat.connection.send($pres());
            }
        );
    },
    pubsubPublish:function(nodeName,message){
           Chat.connection.pubsub.publish(
               nodeName,
               message,
               Chat.onPublish
           );
        Chat.pubsubMessages.push({
            "message" : message,
            "type"    : "sent",
            "nodeName"    : nodeName
        });
    },
    onPublish:function(status){
        Chat.log("Message published",status);
        return true;
    },
    pubsubSubscribe:function(nodeName,options){
        var options = (options) ? options : {};
        Chat.connection.pubsub.subscribe(
            nodeName,
            options,
            Chat.messageReceived,
            function(status){
                Chat.log("Subscribe node created",status)
            },
            function(status){
                console.log("error subscribing to node");
            },
            Chat.connection.jid
        );
    },
    pubsubUnsubscribe:function(nodeName){
        Chat.connection.pubsub.unsubscribe(
            nodeName,
           Chat.getSubJID(Chat.connection.jid),
           '',
           function(status){
                Chat.log("Succesfully unsubscribed from node",status);
           },
           function(status){
               Chat.log("Error unsubscribing from node",status);
           }
        );
    },
    subscribedNodes:[],
    //get all the nodes an individual is subscribed to.
    getSubscriptions:function(){
        Chat.connection.pubsub.getSubscriptions(function(status){
            Chat.log("Got Subscriptions, stored in Chat.subscribedNodes");
            $(status).find("subscription").each(function() {
                Chat.subscribedNodes.push($(this).attr('node'));
            });
        });
    },
    getNodeSubscriptions: function(nodeName){
        var subscribers = [];
        Chat.connection.pubsub.getNodeSubscriptions(nodeName,function(status){
            Chat.log("Got all subscribers to the node",status);
            $(status).find("subscription").each(function() {
                subscribers.push($(this).attr('jid'));
            });

        });
        return subscribers;
    },
    //Experimental Method
    mucSendPresence:function(roomName){
        //http://xmpp.org/extensions/xep-0045.html#createroom
        var presence = $pres({
            from : Chat.connection.jid,
            to:  roomName
        }).c('x',{'xmlns':'http://jabber.org/protocol/muc'});
        Chat.log(presence.tree());
        Chat.connection.send(presence.tree());
    },
    //Experimental Method
    mucCreateRoom:function(roomName){
        Chat.connection.muc.createInstantRoom(roomName,
            function(status){
               Chat.log("Succesfully created ChatRoom",status);
            },
            function(status){
               Chat.log("Error creating ChatRoom",status);
            }
        );
    },
    mucSessionInfo:{},
    mucJoin:function(roomName,nickname,password){
        var nickname = (nickname) ? nickname : Chat.getSubJID(Chat.connection.jid);
        Chat.connection.muc.join(roomName,nickname,Chat.messageReceived,
                                Chat.presenceReceived,Chat.rosterReceived,password);
        Chat.mucSessionInfo['roomName'] = roomName;
        Chat.mucSessionInfo['nickname'] = nickname;
    },
    mucLeave:function(exitMessage){
        Chat.connection.muc.leave(
            Chat.mucSessionInfo['roomName'],
            Chat.mucSessionInfo['nickname'],
            Chat.presenceReceived,
            exitMessage
        );
    },
    mucListRooms:function(){
        Chat.connection.muc.listRooms(
            Strophe.getDomainFromJid(Chat.connection.jid),
            function(status){
                Chat.log("List of Chat Rooms", status);
            },
            function(status){
                Chat.log("Error getting Chat Rooms",status);
            }
        );
    },
    //to send a message to everyone on the group chat
    //in the chatRoom field specify....the chat room subdomain e.g groupchat.localhost
    mucSendMessage:function(chatRoom,message,nickname,type){
        var nickname = (nickname) ? nickname : Chat.getSubJID(Chat.connection.jid);
        Chat.connection.muc.message(chatRoom,nickname,message,'',type);
        Chat.log("Sent message to: " + chatRoom);
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
        // becomes...
        // ramon@localhost
        var Jid = (Jid)?Jid:Chat.connection.Jid;
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
