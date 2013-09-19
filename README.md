Strophe Wrapper Library
=======================

[Strophe](http://strophe.im/strophejs/) JavaScript Wrapper Library for XMPP Web Connections, Messaging, &amp; Presence Notifications from Contacts.  
[Require.js](http://requirejs.org/) was used for the dependencies [Strophe.js, JQuery].

##How to Use the Library##
To use simply include the script:  
`<script data-main="main" src="js/require.js"></script>`

####Source Code####
The main source code can be found in [chat.js](chat.js)

##Example##
#####Gmail Connect Example#####

  **Note: Gmail may require you to verify your account, for security reasons**
  1. Open the `index.html` file in your browser and open up the command prompt(Ctr+Shft+i on Google Chrome). You should see the message `Chat Library ready to use! `
  2. Next connect using your gmail username & password. Type into the command prompt: `Chat.connect("user.name@gmail.com","password","http://bosh.metajack.im:5280/xmpp-httpbind")`
  3. Strophe will try to connect, and once connected will notify you with  `Strophe is connected.` Next we will send a message to ourselves. So type now `Chat.sendMessage("user.name@gmail.com", "Hello, How Are You!")`  
      
  Once sent, you will see:  
    `I sent user.name@gmail.com: Hello, How Are You! `  
  Once the message is received:  
    ```message received:```  
  ```<message to="user.name@gmail.com" from="user.name@gmail.com/12345" type="chat"><body>Hello, How Are You</body></message>```
  4. Next type `Chat.getRoster()` to get an object array of the roster items as such `[{jid:"first.last@gmail.com", name:"first last",subscription:"both"},...,]`
  5. Now lets get their status (online/offline). Type: `Chat.presenceMessage` & you will get a hash map of th econtacts name and status.   
    `{user1@gmail.com/affc018f: "online", user2@gmail/2b6126f3: "offline",...}`
  6. Finally lets disconnect from gmail: `Chat.disconnect()`  
    * `Strophe is disconnecting.`  
    * `Strophe is disconnected. `

  Thats it. We are disconnected.  
  Allso works with [Facebook](http://stackoverflow.com/questions/5897833/architecture-to-facebook-chat-from-a-webpage-xmpp-strophe-punjab) & [Openfire](http://www.igniterealtime.org/projects/openfire/) & [Ejabberd](http://www.ejabberd.im/)
    

##Functionality##
####Connecting####
  `Chat.connect('jabberID','password','BOSH_SERVICE','debuggingMode);`  
  * Bosh_Service: is the name of the BOSH Server and is an optional parameter. Default is 'http://localhost:5280/http-bind'
  * debuggingMode: if true than console will output debuggin messages, false to hide console messages.  
  
####Disconnect:####
  `Chat.disconnect()`
####Roster/Contacts####
  `Chat.getRoster()` returns an object array of the users contacts that includes:
  * jid
  * name  
  * subscription  

To **add a user to your Contacts**/Roster, that already exists, call `Chat.addUser('Jid', 'name', 'groups')`  
To **delete a user** from your Roster: `Chat.removeUser('Jid')`  
To **authorize a user**:  `Chat.authorizeUser('Jid')`  
To **unauthorize a user**:`Chat.unauthorizeUser('Jid')`  
`userExists('Jid')` returns true if a user exists in the contacts list, false if it does not.

####Messaging####
  `Chat.sendMessage('To','message')`  
  * To: the JabberID who the message is addressed to..eg: 'ramon@localhost.com'
  * message: The message string.  
  
Received Message are handled by: `Chat.receiveMessage`  
`Chat.messages` is an array of the received messages for the current user. Each message in the Chat.messages array is an object with the following info: 
  * to 
  * from
  * type
  * messageString  
  
####Publish/Subscribe(PubSub)
 * To create a node: `Chat.createNode('nodeName',{options})`  
 [Options details](http://xmpp.org/extensions/xep-0060.html#owner-create). By default this is an optional parameter with the default options.  
 * `Chat.pubsubNodes` contains a list of all the nodes on the server.
 * `Chat.pubsubJid` contains the Jid of the pubsub node e.g: pubsub.localhost
 * To publish to a new node: `Chat.pubsubPublish('nodeName','message')`
 * To subscribe to a node: `Chat.pubsubSubscribe('nodeName',{options})`  
 [Options details](http://xmpp.org/extensions/xep-0060.html#owner-create). By default this is an optional parameter with the default options.  
 * To unsubscribe: `Chat.pubsubUnsubscribe('nodeName')`  
 * To get the subscriptions for the current user(Jid): `Chat.getSubscriptions()`
 * To get the subscribers for an individual node: `Chat.getNodeSubscriptions('nodeName')`  
 
####Group Chat/Multiple User Chat (MUC) 
 * To get a list of all the saved(persistent) Group Chats: `Chat.mucListRooms()`
 * To join a chat session: `Chat.mucJoin('roomName','nickname','password')`
 * To leave a chat session: `Chat.mucLeave('exitMessage')`  
   + The exitMessage parameter is an optional exit message
 * To send a message to everyone in the chat conversation: `Chat.mucSendMessage('chatRoom','message','nickname','type')`
   + Nickname: is an optional parameter that is the nickname you want others receiving the message to see you as...default is your Jid.
   + Type: an optional parameter by default type='groupchat', but can also be chat for individual chat messages to a single jid.  
 * To send a presence message for room createion call: `Chat.mucSendPresence('roomName')`
 * To create an instant room: `Chat.mucCreateRoom('roomName')` **This is still a little buggy, so might not work for you**
 
####Presence(Online/Offline)####
  `Chat.presenceMessage` is an Object Hashmap that includes the received presence status messages from the users contacts.
  It will look something like such `{admin@localhost/affc018f: "online", ramon@localhost/2b6126f3: "offline"}`

####In-Band User Registration####
 To [register](http://xmpp.org/extensions/xep-0077.html) a user call:
 `Chat.registerUser('Server','Username','Password','BOSH_SERVICE')`  
 * Server: the server name e.g: 'example.com" or 'localhost'
 * Username: If I wanted to create a new user santiago@localhost, I would pass in 'santiago' for the username field.  
   e.g `Chat.registerUser('localhost','santiago','pass','http://localhost:5280/http-bind')`
 * BOSH_SERVICE: The bosh server, an optional parameter that defaults to 'http://localhost:5280/http-bind'  
 

####Message States(Paused,Active,Composing)  
 To send the status of an active conversation, to the invididual who you are actively communicating with call:
 `Chat.sendChatState('Jid','status','type')`
  * Jid: To: the JabberID who the message is addressed to..eg: 'ramon@localhost.com'  
  * status: The status of the person you are conversating with
   1. Active
   2. Composing
   3. Paused
  * Type: the message type, e.g "chat". This is an optinal parameter that will default to chat.
  
 Received state messages will be placed in a hash table: `Chat.chatStates`, which keeps track of the latest chat state message for each jid.
 
####Service Discovery Info####
 To discover information on the Jid, call  
 `Chat.discoInfo('Jid')`

 To see if the discovery resulted in a success or failure, look in `Chat.discoSuccess`, where true means success, and false error.  

####Ping####
To ping another Jid:  
`Chat.ping('Jid')`
Ping success/error information is stored in `Chat.Pings` as true/false pairs.

  
####Log####
  `Chat.log()` behaves just like Console.log() except will only display messages when `Chat.debugginMode === true`  
  To turn off console logs: `Chat.debugginMode = false`

####SendPresence####
To Send a presence message to the xmpp server/other clients: `Chat.sendPresence()`
####SendPriority####
To Send a priority message to the xmpp server/other clients: `Chat.sendPriority('value')`
  * value is a string number ranging from -127 to 128.
  * Setting a negative priority value will mean that a client will appear offline & not receive any messages.(Instead message will be stored on the server for a positive client)
  * The highest priority client for a given JID that is online will receive the message.  
  
####JID Utility####
`Chat.getSubJID('Jid')` is a utility for parsing a JID with a session into the plain JID  
  e.g: "ramon@localhost/1234567" => "ramon@localhost"  
  It returns a string of the parsed JID.
 * The Jid parameter is optional, and by default if no Jid is specified, the Chat.connection.jid will be used.
