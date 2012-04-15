
define(['jquery','underscore','backbone','modelbinding','plugins/base/logic'],
    function($,_,Backbone, ModelBinding,parentPlugin){
      
      var DateModel = parentPlugin.Model.extend({
          defaults : _.extend({},parentPlugin.Model.prototype.defaults,{
              type: 'date',
              replace_title_with_year: true,
              
              width: 3,
              height: 5
          }),
          initialize : function(options){
            options = _.extend(
                {'can_sync' : false},
                options || {}
            );
            parentPlugin.Model.prototype.initialize.call(this,options);
          }
      });
      
      var DateView = parentPlugin.WidgetView.extend({
        initialize : function(options){
          this.updateAt = this._getTomorrowDate().getTime();
          parentPlugin.WidgetView.prototype.initialize.call(this,options);
        },
        _getTomorrowDate : function(){
          var tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
          tomorrow.setHours(0);
          tomorrow.setMinutes(0);
          tomorrow.setSeconds(0);
          tomorrow.setMilliseconds(0);
          
          return tomorrow;
        },
        _getViewData : function(){
          var monthNames = [ "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December" ];
          
          var months = {
            'en' :{
              'full' : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
              'short': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            }
          }
          
          var date = new Date();
          
          return {
            'monthName': months['en']['short'][date.getMonth()],
            'monthNumber': date.getDate(),
            'year' : date.getFullYear(),
            'model' : this.model,
            'jsonModel' : this.model.toJSON()
          };
          

        },
        _checkDate : function(){
          
          var now = Date.now(),
              timeout = 1000;
          
          if (this.updateAt - now <= 0) {
            // update immediately
            this.doUpdateRender();
            this.updateAt = this._getTomorrowDate().getTime();
          }
          
          if (this.updateAt - now < 60*1000) {
            // we entered the last minute, check each second
            timeout = 1000;
          } else {
            // there is still some time, check later
            timeout = Math.floor((this.updateAt - now) / 2);
          }
          
          setTimeout(this._checkDate,timeout);
          
        },
        doRender : function(){
          setTimeout(_.bind(this._checkDate,this),1000);
          return this.template(this._getViewData());
        },
        doUpdateRender : function(){
          var viewData = this._getViewData();
          
          this.$('.dataContainer .timePartTop').html(viewData.monthNumber);
          this.$('.dataContainer .timePartBottom').html(viewData.monthNumber);
          this.$('.dataContainer desc').html(viewData.monthName);
          
          this.$('.titleBox .title').html(
                                          this.model.get('replace_title_with_year') ?
                                            viewData.year
                                          :
                                            this.model.get('title')
                                         );
        }
      });
      
      var DatePreferencesView = parentPlugin.PreferencesView.extend({
          
      });
      
      return _.extend({},parentPlugin,{
          Model : DateModel,
          WidgetView : DateView,
          PreferencesView : DatePreferencesView
      });

});

define.amd = {};