
define(['underscore'],function(_){
  
  var socket,
      user_id
  ;
  
  return {
    init : function(opts){
      opts = _.extend({
        'websocket_url' : document.location.protocol+'//'+document.location.host,
        'user_id' : 'anonymous'
      },opts);
      
      user_id = opts['user_id'];
      
      console.debug('connect websocket to '+opts['websocket_url']);
      socket = io.connect(opts['websocket_url']);
    },
    getSocket : function(){
      return socket;
    },
    getUserId : function(){
      return user_id;
    }
  };
});