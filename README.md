Strophe_Wrapper_Library
=======================

Strophe JS Wrapper Library for Connecting, Messaging, &amp; Presence notifications from Contacts.

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

  
