

define(['jquery','underscore','backbone','modelbinding','main','text!plugins/base/template_widget.html','text!plugins/base/template_conf.html'],
    function($,_,Backbone,ModelBinding,main,templateWidget,templateConf){
      
      var Validator = {
        isNumber : function(value) {
          return typeof value === 'number';
        },
        isNumeric : function(n) {
          // http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
          return !isNaN(parseFloat(n)) && isFinite(n);
        },
        isInteger : function(n){ // note, it implies n IS a number
          return n===+n && n===(n|0);
        },
        isFloat: function(n) { // note, it implies n IS a number
          return n===+n && n!==(n|0);
        },
        isInt : this.isInteger,
        isString : function(value) {
          return typeof value === 'string';
        },
        isFunction: function( obj ) {
          // From jQuery 1.7.1
          // See test/unit/core.js for details concerning isFunction.
          // Since version 1.3, DOM methods and functions like alert
          // aren't supported. They return false on IE (#2968).
          return this._type(obj) === "function";
        },
        isArray: Array.isArray || function( obj ) {
          return this._type(obj) === "array";
        },
        String : {
          /**
           * If regOrString is a regular espression check if value match it
           * If regOrString is a string check if it's equal to value
           *
           * If ignoreWhitespaces is passed and true, ignore trailing whitespaces
           */
          match: function(value,regOrString,ignoreWhitespaces){
            if (ignoreWhitespaces) value = this._trim(value);
            
            if (Validator._type(regOrString) === 'regexp') {
              return regOrString.test(value);
            }
            else return reqOrString === value;
          },
          startsWith: function(str,starts){
            return str.length >= starts.length && str.substring(0, starts.length) === starts;
          },
          endsWith: function(str,ends){
            return str.length >= ends.length && str.substring(str.length - ends.length) === ends;
          },
          isUrl : (function(){
            // javascript version of the regexp found at
            // http://stackoverflow.com/questions/161738/what-is-the-best-regular-expression-to-check-if-a-string-is-a-valid-url
            var reg = new RegExp(
              "^(https?|ftp)://" +                                             // protocol
              "(([a-z0-9$_\\.\\+!\\*\\'\\(\\),;\\?&=-]|%[0-9a-f]{2})+" +       // username
              "(:([a-z0-9$_\\.\\+!\\*\\'\\(\\),;\\?&=-]|%[0-9a-f]{2})+)?" +    // password
              "@)?" +                                                          // auth requires @
              "((([a-z0-9][a-z0-9-]*[a-z0-9]\\.)*" +                           // domain segments AND
              "[a-z][a-z0-9-]*[a-z0-9]" +                                      // top level domain  OR
              "|((\\d|[1-9]\\d|1\\d{2}|2[0-4][0-9]|25[0-5])\\.){3}" +
              "(\\d|[1-9]\\d|1\\d{2}|2[0-4][0-9]|25[0-5])" +                   // IP address
              ")(:\\d+)?" +                                                    // port
              ")(((/+([a-z0-9$_\\.\\+!\\*\\'\\(\\),;:@&=-]|%[0-9a-f]{2})*)*" + // path
              "(\\?([a-z0-9$_\\.\\+!\\*\\'\\(\\),;:@&=-]|%[0-9a-f]{2})*)" +    // query string
              "?)?)?" +                                                        // path and query string optional
              "(#([a-z0-9$_\\.\\+!\\*\\'\\(\\),;:@&=-]|%[0-9a-f]{2})*)?" +     // fragment
              "$"
            ,"i");
            
            return function(value){
              return reg.test(value);
            };
            
          })(),
          // check if it is similar to an email (no hope to comply with the rfc and the mess that's the real world)
          isEmailLike : function(value){
            // something@something with no spaces, one and only one @
            return /^[^\s@]+@[^\s@]{3,}$/.test(value);
          },
          isMD5 : function(value){
            return /^[0-9a-f]{32}$/i.test(value);
          },
          isSHA1 : function(value){
            return /^[0-9a-f]{40}$/i.test(value);
          },
          // jquery 1.7.1 trim code
          _trim : String.prototype.trim ?
            function( text ) {
              return text == null ?
              "" :
              String.prototype.trim.call( text );
            } :
            
            // Otherwise use our own trimming functionality
            function( text ) {
              return text == null ?
              "" :
              text.toString().replace( trimLeft, "" ).replace( trimRight, "" );
            }
        },
        Number : {
          inRange : function(num,min,max,lInc,rInc) {
            return (lInc ? num >= min : num > min)
                    &&
                   (rInc ? num <= max : num < max);
          },
          lt : function(num,max) {
            return num < max;
          },
          lte : function(num,max) {
            return num <= max;
          },
          gt : function(num,min) {
            return num > min;
          },
          gte : function(num,min) {
            return num >= min;
          }
        },
        Array : {
          'in' : function(value,ar) {
            return ar.indexOf(value) !== -1;
          }
        },
        // _type and _class2type ideas from jQuery core.js 1.7.1
        _type : function(obj) {
          
          return obj == null ? // match null and undefined
            String( obj ) :
            this._class2type[ Object.prototype.toString.call(obj) ] || "object";
        },
        _class2type : (function() {
          var classes = ["Boolean","Number","String","Function","Array","Date","RegExp","Object"],
              class2type = {};
          
          for (var i=0,il=classes.length;i<il;i++) {
            class2type[ "[object " + classes[i] + "]" ] = classes[i].toLowerCase();
          };
          
          return class2type;
          
        })()
      };
      
      var WidgetModel = Backbone.Model.extend({
          defaults : {
              _id : null,
              title : "widget title",
              
              last_values : [],
              keep_last_n_values : 2,
              
              service_id: null,
              
              url: null,
              poll_frequency: 1, // check url each n seconds
              
              timeout: 10, // set error after n seconds
              
              data_source : 'url',
              
              updated_at : null,
              
              x : 1,
              y : 1,
              width : 3,
              height: 3
          },
          idAttribute: '_id',
          url: function(){
              var _id = this.get('_id');
              return '/api/widget/'+main.getUserId()+(_id ? '/'+_id : '');
          },
          initialize : function(){
              var that = this;
              main.getSocket().on('service-update', function(data) {
                // update the model status without syncing to the server (no love for infinite loops)
                
                that.set({
                  value : data['last_value'],
                  title : data['desc'],
                  updated_at : data['updated_at']
                });
              });
          },
          getCurrentValue : function(){
              var part = this.get('last_values').slice(-1);
              return part.length ? part[0] : null;
          },
          getPreviousValue : function(){
              var last_values = this.get('last_values');
              if (last_values.length>1) return last_values[last_values.length-2];
              else return null;
          },
          set: function(attributes, options) {
              // update the values' history, dropping the oldest if needed
              if (attributes['value'] !== undefined){
                
                if (!attributes['last_values']) {
                  var last_values = this.get('last_values');
                  
                  attributes['value'] = parseFloat(attributes['value']);
                  
                  last_values.push(attributes['value']);
                  if (last_values.length > this.get('keep_last_n_values')) {
                      last_values.splice(0,1); // FIFO queue (drop the oldest)
                  }
                }
                
                delete(attributes['value']);
              }
              return Backbone.Model.prototype.set.call(this, attributes, options);
          },
          validate : function(attrs){
            var errors = {},
                value = null;
            
            for (var key in attrs) {
              var value = attrs[key];
              
              switch(key) {
                case 'title':
                  attrs[key] = value = $.trim(value);
                  if (! value) {
                    errors[key] = "title can't be empty"
                  }
                  break;
                
              }
            }
            
            //new Validator("1e2").isNumeric().toNumber().isInteger().gt(1).lt(1000)
            
            if (attrs['data_source']==='url') {
              if (! attrs['url'] || $.trim(attrs['url'])==='') {
                errors['url'] = 'Cannot be empty';
              }
              else if (! (Validator.isString(attrs['url']) && Validator.String.isUrl(attrs['url']))) {
                errors['url'] = 'Not a valid url';
              }
              
              if (! attrs['poll_frequency'] || $.trim(attrs['poll_frequency'])===''
                  || $.trim(attrs['poll_frequency'])==='0'){
                errors['poll_frequency'] = 'Cannot be empty or 0';
              }
              else if (! (
                          (
                           Validator.isString(attrs['poll_frequency']) && Validator.isNumeric(attrs['poll_frequency'])
                           ||
                           Validator.isNumber(attrs['poll_frequency'])
                          )
                          && Validator.isInteger(parseFloat(attrs['poll_frequency'])) 
                          && parseInt(attrs['poll_frequency']) > 0
                          )) {
                errors['poll_frequency'] = 'Not a positive integer';
              }
              
            } else if (attrs['data_source']==='service_id') {
              if (! attrs['service_id']) {
                errors['service_id'] = 'Cannot be empty';
              }
            }
            else {
             errors['data_source'] = 'data source must be one of "url" | "service_id"'
            }
            
            if (!_.isEmpty(errors)) {
              return errors;
            }
          }
          
      });
      
      var StandardView = Backbone.View.extend({
          tagName: "div",
          className : "g-box widget-container",
          
          events : {
              "click button.delete" : "doDelete"
          },
          
          initialize: function(opts){
              this.template = _.template(opts['template']);
              
              _.bindAll(this, 'render', 'remove','doDelete');
              
              this.model.on('destroy', this.remove);
              
              //comment to use Backbone.ModelBinding to listen to model changes
              this.model.on('change', this.render);
              
          },
          render: function(){
              this.$el.html('');
              
              var titleBar = _.template('<div><div class="title"><%= title %></div><div class="confButton">x</div></div>',{
                'title' : this.model.get('title')
              });
              
              this.$el.append(titleBar);
              this.$el.append(this.doRender());
              
              var that = this;
              $('.confButton',this.$el).click(function(){
                that.trigger('conf-request');
              });
              
              //uncomment to use Backbone.ModelBinding to listen to model changes
              //Backbone.ModelBinding.bind(this);
              
              return this;
          },
          doRender: function(){
              return '';
          },
          remove: function(){
              this.model.off('change',this.render);
              this.model.off('destroy',this.remove);
              Backbone.ModelBinding.unbind(this);
              
              this.$el.remove();
          },
          doDelete: function(){
              this.model.destroy();
          }
      });
      
      var PreferencesView = Backbone.View.extend({
          tagName: "div",
          className : "dialog widget-conf",
          
          events : {
              "click button.delete" : "doDelete"
          },
          
          initialize: function(opts){
              this.template = _.template(opts['template']);
              
              this.name = opts['name'];
              
              _.bindAll(this, 'render', 'remove','doDelete');
              
              this.model.on('destroy', this.remove);
              
              //comment to use Backbone.ModelBinding to listen to model changes
              //this.model.on('change', this.render);
          },
          render: function(){
              
              this.$el.html(_.template(templateConf,{
                'model' : this.model,
                'jsonModel' : this.model.toJSON(),
                'content' : this.template({
                  'model' : this.model,
                  'jsonModel' : this.model.toJSON()
                })
              }));
              
              //uncomment to use Backbone.ModelBinding to listen to model changes
              //ModelBinding.bind(this, { all: "name" });
              
              var view = this,
                  $form = this.$el.find('form')
                  ;
              
              $form.on('submit',function(ev){
                var form = this;
                try {
                  view.onSave(form);
                } catch(e) {
                  console.error(e);
                }
                return false;
              });
              
              // The error callback will receive model,error,options as arguments
              this.model.on('error',_.bind(this.onError,this));
              
              return this;
          },
          doRender: function(){
              return '';
          },
          doGetFormData: function(form){
            var data = {};
            
            var formInputNames = _.unique(_.filter(_.map($(form).find('input,textarea'),
                                                         function(el){ return el.name }
                                                         ),
                                                   function(el){return el!="";}
                                                  )
                                         );
            
            _.each( formInputNames
                   ,function(key){
                    
                      if (! this[key].tagName ) { // can't use $.isArray, it's an array like object (e.g. a radio)
                        for(var i=0,il=this[key].length;i<il;i++){
                          if (this[key][i].checked) {
                            data[key] = this[key][i].value;
                            break;
                          }
                        }
                      }
                      else if (this[key].type==='checkbox') {
                        data[key] = this[key].checked;
                      }
                      else {
                        data[key] = this[key].value;
                      }
                    }
                   ,form);
            
            return data;
          },
          onSave: function(form){
              // clean errors
              $(form).find('.error').each(function(){$(this).html('')});
              
              var data = this.doGetFormData(form);
              
              var dataIsValid = this.model.set(data);
              
              if (dataIsValid) {
                var view = this;
                this.model.save(null,{
                  error:function(model,response){
                    console.error(response); // XXX alert the user, log the error
                    view.trigger('preferences-saved',[false,response]);
                  },
                  success:function(model,response){
                    view.trigger('preferences-saved',[true]);
                  }
                });
                
                
              }
              
              return dataIsValid;
          },
          onError: function(model,errors,options){
            if (!this.el) return;
            
            var $form = this.$el.find('form');
            
            for (var key in errors) {
              $form.find('.error.'+key).html(errors[key]);
            }
            
          },
          remove: function(){
              this.model.off('change',this.render);
              this.model.off('destroy',this.remove);
              //this.model.off('error'); // XXX this way I remove ALL errors handlers !! add the function !
              ModelBinding.unbind(this);
              
              this.$el.remove();
          },
          doDelete: function(){
              this.model.destroy();
          }
      });
      
      return {
        'Model' : WidgetModel,
        'StandardView' : StandardView,
        'PreferencesView' : PreferencesView,
        'getUserWidgets' : function(cb){
            $.get('/api/widgets/'+main.getUserId())
            .done(cb);
        }
      };
});

define.amd = {};
