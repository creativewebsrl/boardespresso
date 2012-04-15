
define(['jquery','underscore','backbone','modelbinding','plugins/base/logic'],
    function($,_,Backbone, ModelBinding,parentPlugin){
      
      function strEndsWith(sourceStr,endStr) {
        return sourceStr.slice(-(endStr.length))===endStr;
      }
      
      var StatusModel = parentPlugin.Model.extend({
          defaults : _.extend({},parentPlugin.Model.prototype.defaults,{
              
              type: 'status',
              
              show_text_value : true,
              
              treshold_warn : null,
              treshold_alert : 100
          }),
          set : function(key, value, options) {
            
            /* normalization copied by backbone.js */
            var attrs, attr, val;
            if (_.isObject(key) || key == null) {
              attrs = key;
              options = value;
            } else {
              attrs = {};
              attrs[key] = value;
            }
      
            // Extract attributes and options.
            options || (options = {});
            if (!attrs) return this;
            if (attrs instanceof Backbone.Model) attrs = attrs.attributes;
            /* end of normalization code */
            
            // XXX need an automatic converter/validator
            var numberKeys = ['treshold_warn','treshold_alert'];
            key = null;
            
            for (var i=0,il=numberKeys.length;i<il;i++)
            {
                
                key = numberKeys[i];
                
                if (typeof attrs[key]==='string') {
                    
                    attrs[key] = $.trim(attrs[key]).toLowerCase();
                    
                    if (attrs[key]==='') {
                        attrs[key] = null;
                    }
                    /* // cannot serialize Infinity as JSON
                    else if (/^[+]?inf(inity)?$/i.test(attrs[key])) {
                        attrs[key] = Infinity;
                        
                    } else if (/^[-]?inf(inity)?$/i.test(attrs[key])) {
                        attrs[key] = -Infinity;
                    }
                    */
                    else {
                        attrs[key] = parseFloat(attrs[key]);
                    }
                }
            }
            
            return parentPlugin.Model.prototype.set.call(this, attrs, options);
          }
      });
      
      var StatusView = parentPlugin.WidgetView.extend({
          getAlarmClass : function(){
            var curr_value = this.model.getCurrentValue();
            
            return curr_value > this.model.get('treshold_alert') ?
                               'error' :
                               (curr_value > this.model.get('treshold_warn') ?
                                'warning' :
                                'ok'
                               );
          },
          getDelta : function(){
            var curr_value = this.model.getCurrentValue();
            
            return curr_value===null ?
                          0 :
                          (this.model.getPreviousValue()===null ?
                           0 :
                           curr_value*100/this.model.getPreviousValue()-100
                          );
          },
          doRender: function(){
              var curr_value = this.model.getCurrentValue();
              
              return this.template({
                'model' : this.model,
                'jsonModel' : this.model.toJSON(),
                'alarmClass' : this.getAlarmClass(),
                'delta' : this.getDelta()
              });
          },
          doUpdateRender: function(){
              var alarmClass = this.getAlarmClass();
              
              // update label
              this.$('.ledWrapper .label').html(this.model.get('show_text_value') ? alarmClass.toUpperCase() : '');
              
              // update icon
              this.$('.ledWrapper')
              .removeClass('ok warning error')
              .addClass(alarmClass);
          }
      });
      
      var StatusPreferencesView = parentPlugin.PreferencesView.extend({
          doRender: function(){
              var html = this.template({
                model : this.model,
                jsonModel : this.model.toJSON()
              });
              return html;
          }
      });
      
      return _.extend({},parentPlugin,{
          Model : StatusModel,
          WidgetView : StatusView,
          PreferencesView : StatusPreferencesView
      });
      

});

define.amd = {};