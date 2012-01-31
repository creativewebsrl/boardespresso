
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    swig = require('swig');

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
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', routes.index);

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
