Strophe_Wrapper_Library
=======================

Strophe JavaScript Wrapper Library for Connecting, Messaging, &amp; Presence notifications from Contacts.

####Source Code####
The main source code can be found in [chat.js](chat.js)

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
