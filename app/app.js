"use strict";

/**
 * Module dependencies.
 */

require('globalmod');

var express = require('express'),
    app = module.exports = express.createServer();

global['GLOB']['app'] = app;
global['GLOB']['BASE_PATH'] = __dirname;
global['GLOB']['PLUGINS_PATH'] = __dirname+'/public/js/plugins';

var swig = require('swig'),
    io = require('socket.io'),
    mongoose = require('mongoose'),
    mongoStore = require('connect-mongodb'),
    sessionStore = null;

var conf = require('./config'),
    db = require('database'),
    session_key = 'dashboard.sid';

db.init(conf.db);
sessionStore = new mongoStore({db:mongoose.connection.db}); // I should put it after the event 'db connected'


// Configuration

app.configure(function(){
  
  app.set('views', __dirname + '/views');
  
  app.register('.html', swig);
  app.set('view engine', 'html');
  
  swig.init({
    root: __dirname + '/views',
    cache: false,
    allowErrors: true // allows errors to be thrown and caught by express
  });
  
  // Don't allow express to automatically pipe templates into a layout.html file
  // Setting this to false allows you to properly use {% extends %} and {% block %} tags
  app.set('view options', { layout: false });
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: conf.common.session_secret,
    cookie: { maxAge: 60*60*18*1000 }, // 18 hours
    store : sessionStore,
    key : session_key
  }));
  
  app.use(function(req,res,next){
    res.local("session", req.session || {});
    res.local("routing", require('routing'));
    res.local("errors",{});
    next();
  });
  
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

var routes = require('./routes')

if (require.main === module) {
    
    var sio = io.listen(app),
        parseCookie = require('connect').utils.parseCookie,
        Session = require('connect').middleware.session.Session
    ;
    
    // register the socket io listener at a global level
    GLOBAL['GLOB']['sio'] = sio;
    
    sio.configure(function() {
        sio.set('close timeout', 60*60*24); // 24h time out
    });
    
    app.listen(conf.common.server.port);
    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
    
    sio.sockets.on('connection',function(socket){
        var hs = socket.handshake;
        console.log('A socket with sessionID ' + hs.sessionID + ' connected!');

        // only logged in user can connect
        if (! hs.session.user_id) {
          console.log('A non logged in user connected via socket');
          return;
        }
        
        // setup an inteval that will keep our session fresh as long as websocket holds
        var intervalID = setInterval(function () {
            // reload the session (just in case something changed,
            // we don't want to override anything, but the age)
            // reloading will also ensure we keep an up2date copy
            // of the session with our connection.
            hs.session.reload( function () { 
                // "touch" it (resetting maxAge and lastAccess)
                // and save it back again.
                hs.session.touch().save();
            });
        }, 60 * 1000);
        
        socket.on('disconnect', function () {
            console.log('A socket with sessionID ' + hs.sessionID 
                + ' disconnected!');
            // clear the socket interval to stop refreshing the session
            clearInterval(intervalID);
        });
        
        // always keep a channel for the current session
        // this way I could easily send messages from a "controller" to the
        // socket owner using
        // (GLOBAL.) sio.sockets.in(req.sessionID).send('a message')
        //socket.join(hs.sessionID);
        
        socket.join(hs.session.user_id);
        console.log('uid',hs.session.user_id);
        
        socket.on('message',function(data){console.log('ricevuto',data);});
        
    });
    
    sio.set('authorization', function (data, accept) {
        // check if there's a cookie header
        if (data.headers.cookie) {
            // if there is, parse the cookie
            
            data.cookie = parseCookie(data.headers.cookie);
            data.sessionID = data.cookie[session_key];
            
            // save the session store to the data object 
            // (as required by the Session constructor)
            data.sessionStore = sessionStore;
            
            // (literally) get the session data from the session store
            sessionStore.get(data.sessionID, function (err, session) {
                if (err || !session) {
                    // if we cannot grab a session, turn down the connection
                    accept('Error', false);
                } else {
                    // create a session object, passing data as request and our
                    // just acquired session data
                    data.session = new Session(data, session);
                    accept(null, true);
                }
            });
            
        } else {
           // if there isn't, turn down the connection with a message
           // and leave the function.
           return accept('No cookie transmitted.', false);
        }
        
    });
}