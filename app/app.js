"use strict";

/**
 * Module dependencies.
 */

require('globalmod');

var express = require('express'),
    swig = require('swig'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongooseAuth = require('mongoose-auth');

var conf = require('./config'),
    routes = require('./routes');

var dashboardAuth = require('dashboard-auth');
dashboardAuth.init(conf.auth);

mongoose.connect(conf.db.host,conf.db.database,conf.db.port);

var app = module.exports = express.createServer();

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
  app.use(express.session({ secret: conf.common.session_secret }));
  //  mongooseAuth will add routing, must not use the default app.router
  //  app.use(app.router);
  app.use(mongooseAuth.middleware());
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

mongooseAuth.helpExpress(app);

// Routes

app.get('/', routes.index);


app.listen(conf.common.server.port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
