"use strict";

/**
 * Module dependencies.
 */

require('globalmod');

var express = require('express'),
    swig = require('swig'),
    mongoose = require('mongoose'),
    mongooseAuth = require('mongoose-auth'),
    mongoStore = require('connect-mongodb');

var conf = require('./config'),
    routes = require('./routes'),
    db = require('database');

var dashboardAuth = require('dashboard-auth');
dashboardAuth.init(conf.auth);

db.init(conf.db);

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
  app.use(express.session({
    secret: conf.common.session_secret,
    cookie: { maxAge: 60*60*18*1000 }, // 18 hours
    store : new mongoStore({db:mongoose.connection.db})
  }));
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
app.get('/dashboard', routes.dashboard);
app.get('/user_settings', routes.user_settings);
app.get('/sample_update/:user_id/:service_id', routes.sample_update);

// services api
app.get ('/api/services/:user_id', routes.api.services.read);
app.post('/api/services/:user_id', routes.api.services.create);

// single service api
app.put('/api/service/:user_id/:service_id', routes.api.service.update);
app.del('/api/service/:user_id/:service_id', routes.api.service.delete);

if (require.main === module) {
    app.listen(conf.common.server.port);
    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}