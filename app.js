"use strict";

/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    swig = require('swig'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongooseAuth = require('mongoose-auth');

require('./global_modules.js');

var everyauth = require('everyauth');
everyauth.debug = true;

var UserSchema = new Schema({}),
    User;

var auth = require('./config/auth');
var common = require('./config/common');
var db = require('./config/database');

UserSchema.plugin(mongooseAuth, {
    everymodule: {
        everyauth: {
          User: function () {
             return User;
          }
        }
    },
    password :{
        extraParams: {
            name: {
                first: { type: String, required: true, trim: true },
                last:  { type: String, required: true, trim: true }
            },
            active: Boolean,
            password_: String,
            email:  { type: String, required: true, trim: true }
        },
        everyauth: {
            getLoginPath: '/login'
          , postLoginPath: '/login'
          , loginView: 'login.html'
          , getRegisterPath: '/register'
          , postRegisterPath: '/register'
          , registerView: 'register.html'
          , loginSuccessRedirect: '/login'
          , registerSuccessRedirect: '/login',
          
          authenticate: function (login, password) {
            var promise = this.Promise();
            login = login.trim();
            password = password.trim();

            var errors = ['errors'];
            if (!login) errors.login = 'Missing username.';
            if (!password) errors.password = 'Missing password.';
            if (errors.login || errors.password) return errors;
            
            this.User()().authenticate(login, password, function (err, user) {
                var response = ['errors'];
                var errors = response;
                
                if (user) {
                    return promise.fulfill(user);
                }
                else {
                    User.count({'login':login},function(err,count){
                        if (count) {
                            errors.password = "Wrong password";
                        } else {
                            errors.login = "username does not exist";
                        }
                        promise.fulfill(response); 
                    });

                }
            });

            return promise;
          },
          validateRegistration: function (newUserAttrs) {
            // Validate the registration input
            // Return undefined, null, or [] if validation succeeds
            // Return an array of error messages (or Promise promising this array)
            // if validation fails
            //
            // e.g., assuming you define validate with the following signature
            // var errors = validate(login, password, extraParams);
            // return errors;
            //
            // The `errors` you return show up as an `errors` local in your jade template
            //return [];
            var promise = this.Promise();
            var response = ['errors'];
            var errors = response;
            var MIN_LOGIN_LENGTH = auth.password.username_min_length;
            var MIN_PASSWORD_LENGTH = auth.password.password_min_length;
            
            var data = newUserAttrs;
            
            if (!data.name || !data.name.first || 
                 !data.name.first.trim()) {
                errors.first_name = 'required';
                data.name.first = '';
            } else data.name.first = data.name.first.trim();
            
            if (!data.name || !data.name.last || 
                 !data.name.last.trim()) {
                errors.last_name = 'required';
                data.name.last = '';
            } else data.name.last = data.name.last.trim();
            
            if (!data.login || !data.login.trim() ) {
                errors.login = 'required';
                data.login.last = '';
            } else if (data.login.length < MIN_LOGIN_LENGTH) {
                errors.login = 'username too short (min '+MIN_LOGIN_LENGTH+' characters)';
            }
            else data.login = data.login.trim();
            
            if (!data.password || !data.password.trim() ) {
                errors.password = 'required';
            } else if (data.password.length < MIN_PASSWORD_LENGTH) {
                errors.password = 'password too short (min '+MIN_PASSWORD_LENGTH+' characters)';
            }
            
            if (data.password !== data.password_) {
                errors.password = 'passwords differ';
                data.password = '';
            }
            delete(data.password_); // we do not want to save it or redraw it
            
            function validateEmail(value) {
                // From Scott Gonzalez: http://projects.scottsplayground.com/email_address_validation/
                var isValid = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i.test(value);
              
                return isValid;
            }
            
            if (!data.email || !data.email.trim() ) {
                errors.email = 'required';
            } else if (!validateEmail(data.email)) {
                errors.email = 'does not seem to be an e-mail';
            } else data.email = data.email.trim();
            
            data['active'] = false;
            
            User.count({'login':data.login},function(err,count){
                if (count) {
                    errors.login = "Username not available";
                    promise.fulfill(response);
                } else {
                    
                    User.count({'email':data.email},function(err,count){
                        if (count) {
                            errors.email = "e-mail yet in use";
                        } else if (
                                !( errors.login      || 
                                   errors.password   || 
                                   errors.first_name ||
                                   errors.last_name  ||
                                   errors.email
                                   )) {
                            response = [];
                        }
                        promise.fulfill(response);
                    });
                }
                
            });
         
            return promise;
          },
          registerUser: function(newUserAttrs) {
            var promise = this.Promise();
            
            this.User()().create(newUserAttrs, function (err, createdUser) {
                if (err) {
                    var error = [];
                    if (/duplicate key/.test(err)) {
                        error.generic = 'The username has just been taken by someone else';
                        return promise.fulfill(error);
                    }
                    return promise.fail(err);
                }
                promise.fulfill(createdUser);
            });
            return promise;
          },
          displayRegister: function(req,res){
            if (req.loggedIn) res.redirect(this.loginSuccessRedirect());
            else {
                res.render(this.registerView(),{
                    'url_register':this.getRegisterPath()
                });
            }
          },
          respondToRegistrationFail:function(req,res,errors,newUserAttributes){
            if (!errors || !errors.length) return;
            if (req.loggedIn) res.redirect(this.loginSuccessRedirect());
            else {
                res.render(this.registerView(),{
                    'errors':errors,
                    'prev':newUserAttributes,
                    'url_register':this.getRegisterPath()
                });
            }
          },
          displayLogin: function(req,res){
            res.render(this.loginView(),{
                'url_login':this.getLoginPath(),
                'url_logout':this.logoutPath(),
                'url_register':this.getRegisterPath()
            });
          },
          respondToLoginFail: function(req,res,errors,login) {
            if (!errors || !errors.length) return;
            res.render(this.loginView(),{
                'errors':errors,
                'login':login,
                'url_login':this.getLoginPath(),
                'url_logout':this.logoutPath(),
                'url_register':this.getRegisterPath()
            });
          },
        }
    }
});

mongoose.model('User', UserSchema);

mongoose.connect(db.host,db.database,db.port);

User = mongoose.model('User');
//User = mongoose.model('User', UserSchema);

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
  app.use(express.session({ secret: common.session_secret }));
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


app.listen(common.server.port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
