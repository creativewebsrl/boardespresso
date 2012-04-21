
define(['jquery','underscore','backbone','modelbinding','plugins/status/logic'],
    function($,_,Backbone, ModelBinding,parentPlugin){
      
      var GaugeModel = parentPlugin.Model.extend({
          defaults : _.extend({},parentPlugin.Model.prototype.defaults,{
              type: 'gauge',
              min_value: 0,
              max_value: 100,
              
              width: 5,
              height: 5
          })
      });
      
      var GaugeView = parentPlugin.WidgetView.extend({
        doUpdateRender : function(){
          var curr_value = this.model.getCurrentValue(),
              percentage = curr_value/this.model.get('max_value')*100;
          
          // update percentage
          this.$('.pointerMask').css('-moz-transform','rotate('+(percentage*1.8).toFixed(2)+'deg)');
          this.$('.pointerMask').css('-moz-transition-duration','0.5s');
          
          this.$('.percentageBox').html(percentage.toFixed(0));
        }
      });
      
      var GaugePreferencesView = parentPlugin.PreferencesView.extend({
          
      });
      
      return _.extend({},parentPlugin,{
          Model : GaugeModel,
          WidgetView : GaugeView,
          PreferencesView : GaugePreferencesView
      });

});

define.amd = {};