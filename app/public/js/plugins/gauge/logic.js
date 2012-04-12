
define(['jquery','underscore','backbone','modelbinding','plugins/status/logic'],
    function($,_,Backbone, ModelBinding,parentPlugin){
      
      var GaugeModel = parentPlugin.Model.extend({
          defaults : _.extend({},parentPlugin.Model.prototype.defaults,{
              type: 'gauge'
          })
      });
      
      var GaugeView = parentPlugin.WidgetView.extend({
      });
      
      var GaugePreferencesView = parentPlugin.PreferencesView.extend({
          
      });
      
      return _.extend(parentPlugin,{
          Model : GaugeModel,
          WidgetView : GaugeView,
          PreferencesView : GaugePreferencesView
      });

});

define.amd = {};