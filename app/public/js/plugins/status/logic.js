
define(['jquery','underscore','backbone','modelbinding','boardWidget'],
    function($,_,Backbone, ModelBinding,boardWidget){
      
      var plugin = {
          'name' : 'status',
          'init' : function(cb){
            this.confModel = null;
            this.view = null;
            
            this._getWidgetTemplate(function(templateHtml){
              this.confModel = new CustomWidgetConfModel();
              
              this.view = new StatusViewClass({
                  'model'    : this.confModel,
                  'template' : templateHtml
              });
              
              this.view.render();
              
              cb.call(this,plugin);
            });
            
          },
          'getElement' : function(){
            return this.view.$el;
          },
          '_getWidgetTemplate' : function(cb){
            this._getTemplate(cb,'template_widget.html');
          },
          '_getConfTemplate' : function(cb){
            this._getTemplate(cb,'templates_conf.html');
          },
          '_getTemplate' : function(cb,fileName){
            // XXX should I cache the results (and give a way to flush it) ?
            var that = this;
            require(['text!plugins/'+this.name+'/'+fileName],function(data){
                cb.call(that,data);
            });
          }
      };
      
      var baseConfModel = boardWidget.getConfModelClass();
      
      var CustomWidgetConfModel = baseConfModel.extend({
          defaults : _.extend({},baseConfModel.prototype.defaults,{
              
              show_text_value : true,
              show_visual_alarm : true,
              show_direction : true,
              
              treshold_warn : null,
              treshold_alarm : 100,
              
              min_value : 0,
              max_value : Infinity
          })
      });
      
      var baseWidgetClass = boardWidget.getWidgetViewClass();
      
      var StatusViewClass = baseWidgetClass.extend({
          doRender: function(){
              var jsonModel = this.model.toJSON();
              
              var value = this.model.get('value'),
                  curr_value = this.model.getCurrentValue(),
                  prev_value = this.model.getPreviousValue()
                  
                  ;
              
              var html = this.template({
                  'status': jsonModel,
                  'alarmClass' : value > this.model.get('treshold_alarm') ? 'red' : 'green',
                  'valueDirection' : curr_value===prev_value
                                     ? 'equal' : (curr_value > prev_value ? 'greater' : 'lesser')
              });
              
              return html;
          }
      });
      
      return plugin;

});

define.amd = {};