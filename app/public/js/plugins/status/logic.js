
define(['jquery','underscore','backbone','modelbinding','plugins/base/logic'],
    function($,_,Backbone, ModelBinding,basePlugin){
      
      var StatusModel = basePlugin.Model.extend({
          defaults : _.extend({},basePlugin.Model.prototype.defaults,{
              
              type: 'status',
              
              show_text_value : true,
              show_visual_alarm : true,
              show_direction : true,
              
              treshold_warn : null,
              treshold_alarm : 100,
              
              min_value : 0,
              max_value : Infinity
          })
      });
      
      var StatusView = basePlugin.StandardView.extend({
          doRender: function(){
              
              var curr_value = this.model.getCurrentValue(),
                  prev_value = this.model.getPreviousValue()
                  ;
              
              var html = this.template({
                  'model' : this.model,
                  'jsonModel': this.model.toJSON(),
                  'alarmClass' : curr_value > this.model.get('treshold_alarm') ? 'red' : 'green',
                  'valueDirection' : curr_value===prev_value
                                     ? 'equal' : (curr_value > prev_value ? 'greater' : 'lesser')
              });
              
              return html;
          }
      });
      
      var StatusPreferencesView = basePlugin.PreferencesView.extend({
          doRender: function(){
              var html = this.template({
                model : this.model,
                jsonModel : this.model.toJSON()
              });
              return html;
          }
      });
      
      function makeInstance(){
          
          var plugin = {
              'name' : 'status',
              'init' : function(cb,data){
                if (!data) data = {};
                
                this.confModel = new StatusModel(data);
                this.view = null;
                this.confView = null;
                
                var that = this;
                
                this._getWidgetTemplate(function(templateHtml){
                  
                  this.view = new StatusView({
                      'model'    : this.confModel,
                      'template' : templateHtml
                  });
                  
                  _.extend(this.view , Backbone.Events);
                  
                  this.view.render();
                  
                  this._getConfTemplate(function(templateHtml){
                    
                    var confView = this.confView = new StatusPreferencesView({
                        'name'     : this.name,
                        'model'    : this.confModel,
                        'template' : templateHtml
                    });
                    
                    this.view.on('conf-request',function(){
                      confView.render();
                      confView.$el.dialog({
                        title : that.name + ' configuration',
                        autoOpen: true
                      });
                    });
                    
                    confView.on('preferences-saved',function(success){
                      confView.remove();
                    });
                    
                    cb.call(this,plugin);
                  });
                  
                });
                
              },
              'getElement' : function(){
                return this.view.$el;
              },
              '_getWidgetTemplate' : function(cb){
                this._getTemplate(cb,'template_widget.html');
              },
              '_getConfTemplate' : function(cb){
                this._getTemplate(cb,'template_conf.html');
              },
              '_getTemplate' : function(cb,fileName){
                // XXX should I cache the results (and give a way to flush it) ?
                var that = this;
                require(['text!plugins/'+this.name+'/'+fileName],function(data){
                    cb.call(that,data);
                });
              }
          };
          
          return plugin;
      }
      
      return {
          make : function(){
              return makeInstance();
          }
      };
      

});

define.amd = {};