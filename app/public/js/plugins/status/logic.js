
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
          set : function(attributes,options){
            
            // XXX need an automatic converter/validator
            var numberKeys = ['treshold_warn','treshold_alert'],
                key = null;
            
            for (var i=0,il=numberKeys.length;i<il;i++)
            {
                
                key = numberKeys[i];
                
                if (typeof attributes[key]==='string') {
                    
                    attributes[key] = $.trim(attributes[key]).toLowerCase();
                    
                    if (attributes[key]==='') {
                        attributes[key] = null;
                    }
                    /* // cannot serialize Infinity as JSON
                    else if (/^[+]?inf(inity)?$/i.test(attributes[key])) {
                        attributes[key] = Infinity;
                        
                    } else if (/^[-]?inf(inity)?$/i.test(attributes[key])) {
                        attributes[key] = -Infinity;
                    }
                    */
                    else {
                        attributes[key] = parseFloat(attributes[key]);
                    }
                }
            }
            
            
            
            return Backbone.Model.prototype.set.call(this, attributes, options);
          }
      });
      
      var StatusView = parentPlugin.WidgetView.extend({
          doRender: function(){
              
              var curr_value = this.model.getCurrentValue();
              
              return this.template({
                'model' : this.model,
                'jsonModel' : this.model.toJSON(),
                'alarmClass' : curr_value > this.model.get('treshold_alert') ?
                               'error' :
                               (curr_value > this.model.get('treshold_warn') ?
                                'warning' :
                                'ok'
                              ),
                'delta' : curr_value===null ?
                          0 :
                          (this.model.getPreviousValue()===null ?
                           0 :
                           curr_value*100/this.model.getPreviousValue()-100
                          )
              });
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
      
      return _.extend(parentPlugin,{
          Model : StatusModel,
          WidgetView : StatusView,
          PreferencesView : StatusPreferencesView
      });
      

});

define.amd = {};