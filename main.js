/**
 * Created with JetBrains WebStorm.
 * User: rrovirosa
 * Date: 9/4/13
 * Time: 2:03 PM
 * To change this template use File | Settings | File Templates.
 */


requirejs.config({
    shim: {
        'chat': ['js/jquery-2.0.3.min','js/strophe'],
        'main'    : ['chat']
    }

});

require(["chat"],function(){
   //Chat.connect("ramon@localhost","ramon");
    Chat.log("hello");
});