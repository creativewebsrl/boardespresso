

var db = require('database');
    api = require('./api');
    
exports.api = require('./api');

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.user_settings = function(req, res){
  res.render('user_settings', { });
};
