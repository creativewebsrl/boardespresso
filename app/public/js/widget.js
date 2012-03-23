

define(['jquery','underscore','backbone','modelbinding','main'],
    function($,_,Backbone,ModelBinding,main){
      
      var WidgetConfModel = Backbone.Model.extend({
          defaults : {
              _id : null,
              label : "title",
              
              value : null,
              last_values : [null],
              keep_last_n_values : 2,
              
              service_id: null,
              url: null,
              
              set_error_after_n_seconds: 10, // seconds
              
              updated_at : null,
              
              x : 1,
              y : 1,
              width : 3,
              height: 3
          },
          idAttribute: '_id',
          url: function(){
              var _id = this.get('_id');
              return '/api/service/'+main.getUserId()+(_id ? '/'+_id : '');
          },
          initialize : function(){
              var that = this;
              main.getSocket().on('service-update', function(data) {
                // update the model status without syncing to the server (no love for infinite loops)
                
                that.set({
                  value : data['last_value'],
                  label : data['desc'],
                  updated_at : data['updated_at']
                });
              });
          },
          getCurrentValue : function(){
              return this.get('value');
          },
          getPreviousValue : function(){
              var last_values = this.get('last_values');
              if (last_values.length>1) return last_values[last_values.length-2];
              else return null;
          },
          set: function(attributes, options) {
              // update the values' history, dropping the oldest if needed
              if (attributes['value'] !== undefined && !attributes['last_values']) {
                  var curr_value = this.get('value'),
                      last_values = this.get('last_values');
                  
                  // save in attributes['value'] to pass it later to the parent method
                  attributes['value'] = parseFloat(attributes['value']);
                  
                  last_values.push(attributes['value']);
                  if (last_values.length > this.get('keep_last_n_values')) {
                      last_values.splice(0,1);
                  }
              }
              
              Backbone.Model.prototype.set.call(this, attributes, options);
              
              return this;
          }
          
      });
      
      var WidgetViewClass = Backbone.View.extend({
          tagName: "div",
          className : "g-box widget-container",
          
          events : {
              "click button.delete" : "doDelete"
          },
          
          initialize: function(opts){
              this.template = _.template(opts['template']);
              
              _.bindAll(this, 'render', 'remove','doDelete');
              
              this.model.on('destroy', this.remove);
              
              //comment to use Backbone.ModelBinding to listen to model changes
              this.model.on('change', this.render);
              
          },
          render: function(){
              this.$el.html('');
              
              var titleBar = _.template('<div class="title"><%= label %><div class="confButton"></div></div>',{
                'label' : this.model.get('label')
              });
              
              this.$el.append(titleBar);
              this.$el.append(this.doRender());
              
              //uncomment to use Backbone.ModelBinding to listen to model changes
              //Backbone.ModelBinding.bind(this);
              
              return this;
          },
          doRender: function(){
              return '';
          },
          remove: function(){
              this.model.off('change',this.render);
              this.model.off('destroy',this.remove);
              Backbone.ModelBinding.unbind(this);
              
              this.$el.remove();
          },
          doDelete: function(){
              this.model.destroy();
          }
      });
      
      return {
        'getConfModelClass' : function() { return WidgetConfModel; },
        'getWidgetViewClass' : function() { return WidgetViewClass; }
      };
});

define.amd = {};
