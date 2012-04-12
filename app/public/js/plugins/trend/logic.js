
define(['jquery','underscore','backbone','modelbinding','plugins/status/logic'],
    function($,_,Backbone, ModelBinding,parentPlugin){
      
      var TrendModel = parentPlugin.Model.extend({
          defaults : _.extend({},parentPlugin.Model.prototype.defaults,{
              type: 'trend'
          })
      });
      
      var TrendView = parentPlugin.WidgetView.extend({
      });
      
      var TrendPreferencesView = parentPlugin.PreferencesView.extend({
          
      });
      
      return _.extend(parentPlugin,{
          Model : TrendModel,
          WidgetView : TrendView,
          PreferencesView : TrendPreferencesView
      });

});

define.amd = {};