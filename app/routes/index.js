"use strict";

require('globalmod');

var routing = require('routing'),
    i18n = function(x){return x; },
    app = global['GLOB']['app'];


_.extend(routing,{
    home:      i18n('/'),
    login:     i18n('/login'),
    loggedin:  i18n('/loggedin'),
    logout:    i18n('/logout'),
    register:  i18n('/register'),
    dashboard: i18n('/dashboard'),
    user_settings: i18n('/user/settings')
});

function connect_routes(routes,routing){
    _.each(routes,function(value,route){
        if ( typeof value === 'function' || Array.isArray(value)) {
            app.get(routing[route],value);
        } else {
            _.each(value,function(controllers,httpVerb){
                app[httpVerb](routing[route],controllers);
            });
        }
    });
}

connect_routes(require('./auth'),routing);

var api = require('./api');


app.get(routing.home, function(req, res){
  res.render('index', { title: 'Express' });
});

app.get(routing.dashboard, function(req, res){
  if (!req.user) res.send(403);
  
  res.render('dashboard', { 'user_id' : req.user._id });
});

app.get(routing.user_settings, function(req, res){
  res.render('user_settings', { });
});

// services api
app.get ('/api/services/:user_id', api.services.read);

// single service api
app.post('/api/service/:user_id', api.service.create);
app.get ('/api/service/:user_id/:service_id?', api.service.read);
app.put ('/api/service/:user_id/:service_id', api.service.update);
app.del ('/api/service/:user_id/:service_id', api.service.delete);

// widgets api
app.get ('/api/widgets/:user_id', api.widgets.read);

// single widget api
app.post('/api/widget/:user_id', api.widget.create);
app.get ('/api/widget/:user_id/:widget_id?', api.widget.read);
app.put ('/api/widget/:user_id/:widget_id', api.widget.update);
app.del ('/api/widget/:user_id/:widget_id', api.widget.delete);

// plugins api
app.get('/api/plugins', api.plugins.read);

// single plugin api
app.get('/api/plugin/:name', api.plugin.read);


module.exports = {};