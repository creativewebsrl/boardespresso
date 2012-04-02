

define(['jquery','underscore','backbone','modelbinding','main'],
    function($,_,Backbone,ModelBinding,main){
      
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
              label : "title",
              
              value : null,
              last_values : [null],
              keep_last_n_values : 2,
              
              service_id: null,
              url: null,
              
              set_error_after_n_seconds: 10, // seconds
              
              updated_at : null,
              
              x : 1,
              y : 1,
              width : 3,
              height: 3
          },
          idAttribute: '_id',
          url: function(){
              var _id = this.get('_id');
              return '/api/service/'+main.getUserId()+(_id ? '/'+_id : '');
          },
          initialize : function(){
              var that = this;
              main.getSocket().on('service-update', function(data) {
                // update the model status without syncing to the server (no love for infinite loops)
                
                that.set({
                  value : data['last_value'],
                  label : data['desc'],
                  updated_at : data['updated_at']
                });
              });
          },
          getCurrentValue : function(){
              return this.get('value');
          },
          getPreviousValue : function(){
              var last_values = this.get('last_values');
              if (last_values.length>1) return last_values[last_values.length-2];
              else return null;
          },
          set: function(attributes, options) {
              // update the values' history, dropping the oldest if needed
              if (attributes['value'] !== undefined && !attributes['last_values']) {
                  var curr_value = this.get('value'),
                      last_values = this.get('last_values');
                  
                  // save in attributes['value'] to pass it later to the parent method
                  attributes['value'] = parseFloat(attributes['value']);
                  
                  last_values.push(attributes['value']);
                  if (last_values.length > this.get('keep_last_n_values')) {
                      last_values.splice(0,1);
                  }
              }
              
              Backbone.Model.prototype.set.call(this, attributes, options);
              
              return this;
          }
          
      });
      
      var WidgetViewClass = Backbone.View.extend({
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
              
              var titleBar = _.template('<div class="title"><%= label %><div class="confButton"></div></div>',{
                'label' : this.model.get('label')
              });
              
              this.$el.append(titleBar);
              this.$el.append(this.doRender());
              
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
      
      return {
        'getConfModelClass' : function() { return WidgetConfModel; },
        'getWidgetViewClass' : function() { return WidgetViewClass; }
      };
});

define.amd = {};
