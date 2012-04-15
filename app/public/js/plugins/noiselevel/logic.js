
define(['jquery','underscore','backbone','modelbinding','plugins/base/logic'],
    function($,_,Backbone, ModelBinding,parentPlugin){
      
      var NoiseLevelModel = parentPlugin.Model.extend({
          defaults : _.extend({},parentPlugin.Model.prototype.defaults,{
              type: 'noiselevel',
              min_value: 0,
              max_value: 100,
              
              width: 3,
              height: 8
          })
      });
      
      var NoiseLevelView = parentPlugin.WidgetView.extend({
        doRender : function(){
          var curr_value = this.model.getCurrentValue(),
              percentage = curr_value*100/this.model.get('max_value');
          
          return this.template({'percentage':percentage});
        },
        doUpdateRender : function(){
          var curr_value = this.model.getCurrentValue(),
              percentage = curr_value*100/this.model.get('max_value'),
              delta = this.getDelta();
          
          // update fill level
          this.$('.levelContainer')
          .removeClass('positive equal negative')
          .addClass(delta > 0 ? 'positive' : (delta===0 ? 'equal' : 'negative'));
          
          this.$('.levelContainer .level .value')
          .css('height',percentage+'%')
          .css('-moz-transition-duration','0.5s');
          
          // update percentage
          this.$('.percentageBox').html(percentage.toFixed(0));
        }
      });
      
      var NoiseLevelPreferencesView = parentPlugin.PreferencesView.extend({
          
      });
      
      return _.extend({},parentPlugin,{
          Model : NoiseLevelModel,
          WidgetView : NoiseLevelView,
          PreferencesView : NoiseLevelPreferencesView
      });

});

define.amd = {};