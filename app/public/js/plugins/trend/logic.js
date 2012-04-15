
define(['jquery','underscore','backbone','modelbinding','plugins/status/logic'],
    function($,_,Backbone, ModelBinding,parentPlugin){
      
      var TrendModel = parentPlugin.Model.extend({
          defaults : _.extend({},parentPlugin.Model.prototype.defaults,{
              type: 'trend'
          })
      });
      
      var TrendView = parentPlugin.WidgetView.extend({
        doUpdateRender : function(){
          var curr_value = this.model.getCurrentValue(),
              delta = this.getDelta();
          
          // update percentage
          this.$('.widget-trend .percentage .delta').html(delta.toFixed(2));
          
          // update arrow
          this.$('.widget-trend .icon-trend')
          .removeClass('icon-arrow-up icon-repeat icon-arrow-down')
          .addClass(this.getDelta() > 0 ? 'icon-arrow-up' : (delta===0 ? 'icon-repeat' : 'icon-arrow-down'));
          
          // update value
          this.$('.widget-trend .dataRow')
          .removeClass('positive equal negative')
          .addClass(this.getDelta() > 0 ? 'positive' : (delta===0 ? 'equal' : 'negative'))
          .html(curr_value);
        }
      });
      
      var TrendPreferencesView = parentPlugin.PreferencesView.extend({
          
      });
      
      return _.extend({},parentPlugin,{
          Model : TrendModel,
          WidgetView : TrendView,
          PreferencesView : TrendPreferencesView
      });

});

define.amd = {};