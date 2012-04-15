
define(['jquery','underscore','backbone','modelbinding','plugins/base/logic'],
    function($,_,Backbone, ModelBinding,parentPlugin){
      
      var TimeModel = parentPlugin.Model.extend({
          defaults : _.extend({},parentPlugin.Model.prototype.defaults,{
              type: 'time',
              show_seconds: false,
              
              width: 7,
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
      
      var TimeView = parentPlugin.WidgetView.extend({
        initialize : function(options){
          this.updateEach = 1000;
          this._intervalId = null;
          this._cacheElems = null;
          
          TimeView.__super__.initialize.call(this,options);
          
          var view = this;
          this.model.on('change:show_seconds',function(){
            view.updateEach = view.model.get('show_seconds') ? 100 : 1000;
            
            view.$('.dataContainer .seconds').each(function(){
              $(this).css('display',view.model.get('show_seconds') ? 'inline-block' : 'none');
            });
            
            view.resetInterval();
          });
          
        },
        resetInterval : function(){
          clearInterval(this._intervalId);
          this._intervalId = setInterval(_.bind(this.doUpdateRender,this),this.updateEach);
        },
        _getViewData : function(){
          var date = new Date();
          
          return {
            'hours' :   ('0'+date.getHours()).slice(-2).split(''),
            'minutes' : ('0'+date.getMinutes()).slice(-2).split(''),
            'seconds' : ('0'+date.getSeconds()).slice(-2).split(''),
            'show_seconds' : this.model.get('show_seconds')
          };
        },
        doRender : function(){
          /* wait that is rendered before let the timer start // XXX find a better way */
          setTimeout(_.bind(this.resetInterval,this),1000);
          
          return this.template(this._getViewData());
        },
        doUpdateRender : function(){
          var viewData = this._getViewData();
          
          if (!this._cacheElems) {
            this._cacheElems = {
              'hours'   : {
                  'sx' : this.$('.dataContainer .hours .timeIntSx .value'),
                  'dx' : this.$('.dataContainer .hours .timeIntDx .value')
              },
              'minutes' : {
                  'sx' : this.$('.dataContainer .minutes .timeIntSx .value'),
                  'dx' : this.$('.dataContainer .minutes .timeIntDx .value')
              },
              'seconds' : {
                  'sx' : this.$('.dataContainer .seconds .timeIntSx .value'),
                  'dx' : this.$('.dataContainer .seconds .timeIntDx .value')
              }
            };
          }
          
          // hours
          this._cacheElems['hours']['sx'][0].innerHTML = viewData.hours[0];
          this._cacheElems['hours']['sx'][1].innerHTML = viewData.hours[0];
          
          this._cacheElems['hours']['dx'][0].innerHTML = viewData.hours[1];
          this._cacheElems['hours']['dx'][1].innerHTML = viewData.hours[1];
          
          // minutes
          this._cacheElems['minutes']['sx'][0].innerHTML = viewData.minutes[0];
          this._cacheElems['minutes']['sx'][1].innerHTML = viewData.minutes[0];
          
          this._cacheElems['minutes']['dx'][0].innerHTML = viewData.minutes[1];
          this._cacheElems['minutes']['dx'][1].innerHTML = viewData.minutes[1];
          
          // seconds
          this._cacheElems['seconds']['sx'][0].innerHTML = viewData.seconds[0];
          this._cacheElems['seconds']['sx'][1].innerHTML = viewData.seconds[0];
          
          this._cacheElems['seconds']['dx'][0].innerHTML = viewData.seconds[1];
          this._cacheElems['seconds']['dx'][1].innerHTML = viewData.seconds[1];
          
        }
      });
      
      var TimePreferencesView = parentPlugin.PreferencesView.extend({
          
      });
      
      return _.extend({},parentPlugin,{
          Model : TimeModel,
          WidgetView : TimeView,
          PreferencesView : TimePreferencesView
      });

});

define.amd = {};