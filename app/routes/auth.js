"use strict";

var routing = require('routing'),
    db = require('database');
    
    
function restrict(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect(routing.login);
  }
}

module.exports = {
    
    register: {
        get: function(req, res){
            if (req.session && req.session.user) {
                res.redirect(routing.home);
                return;
            }
            
            res.render('user_register', { });
        },
        post: function(req, res){
            
            if (req.session && req.session.user) {
                res.redirect(routing.home);
                return;
            }
            
            delete(req.body.user._id); // ensures no one can overwrite an existing _id
            
            var User = db.model('User'),
                userObj = new User(req.body.user);
            
            if (req.body.user.password !== req.body.user.password2) {
                res.render('user_register', { user: userObj, errors: {'password2':"You must write twice the same password"} });
                  return;
            }
          
            userObj.save(function(err){
                if (err) {
                    
                    var errors = {};
                    
                    if (err.code === 11000) { // duplicate key (surely "email" here)
                        errors.generic = 'That e-mail has yet been used';
                    } else {
                        errors.generic = 'An error occurred, please try again in a few minutes';
                        console.error(err);
                    }
                    
                    res.render('user_register', { user: userObj, errors: errors });
                } else {
                    console.log("registrato correttamente",userObj);
                    // Regenerate session when signing in to prevent fixation
                    req.session.regenerate(function(){
                      req.session.user = {id: userObj.id, email: userObj.email};
                      res.redirect(routing.loggedin);
                    });
                }
            });
          
        }
    },
    
    logout: function(req, res){
        if (req.session) {
          req.session.destroy(function(){});
        }
        res.redirect(routing.home);
    },
    login: {
        get: function(req, res){
            res.render('login',{});
        },
        post : function(req,res){
            
            if (!req.body.login.username || !req.body.login.password) {
              res.render('login', { errors: { login: "You must provide username and password"} });
              return;
            }
            
            var User = db.model('User');
            User.find({email:req.body.login.username},function(err,users){
              if (err) {
                  console.error(err);
                  res.render('login', { errors: {login:'An error occurred, please try again'} });
              } else if (users.length === 0) {
                  res.render('login', { errors: {login:'No match found'} }); // don't tell if the username exist or not
              }
              else {
                  var userObj = new User(users[0]);
                  if (userObj.authenticate(req.body.login.password))
                  {
                      // Regenerate session when signing in to prevent fixation
                      req.session.regenerate(function(){
                        req.session.user = {id: userObj.id, email: userObj.email};;
                        res.redirect(routing.loggedin);
                      });
                  }
                  else {
                      res.render('login', { errors: {login:'No match found'} }); // don't tell if the username exist or not
                  }
              }
              
            });
            
        }
        
    },
    
    loggedin: [
        restrict,
        function(req, res){
            res.render('logged_in',{});
        }
    ]
    
};

