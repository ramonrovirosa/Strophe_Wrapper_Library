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
  
####Presence(Online/Offline)####
  `Chat.presenceMessage` is an Object Hashmap that includes the received presence status messages from the users contacts.
  It will look something like such `{admin@localhost/affc018f: "online", ramon@localhost/2b6126f3: "offline"}`
  
####Log####
  `Chat.log()` behaves just like Console.log() except will only display messages when `Chat.debugginMode === true`

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
