
define([
    'jquery','underscore','backbone','modelbinding'
  ], function ($, _, Backbone, ModelBinding ) {

    ModelBinding.Configuration.configureAllBindingAttributes("class");
    
    var ServiceModel = Backbone.Model.extend({
        defaults : {
            _id : undefined,
            desc : "",
            last_value : "",
            updated_at : null
        },
        idAttribute: '_id',
        url: function(){
            var _id = this.get('_id');
            return '/api/service/'+this._user_id+(_id ? '/'+_id : '');
        },
        setUserId: function(user_id){
          this._user_id = user_id;
        }
        
    });
    
    var ServicesCollection = Backbone.Collection.extend({
        model: ServiceModel,
        url : '/api/services/'+this._user_id,
        setUserId: function(user_id){
          this._user_id = user_id;
        }
    });
    
    
    var ServiceViewClass = Backbone.View.extend({
        tagName: "div",
        className : "",
        
        events : {
            "click button.delete" : "doDelete",
            "click button.save" : "doSave",
        },
        
        template: _.template($("#service-template").html()),
    
        initialize: function(){ 
            _.bindAll(this, 'render', 'remove','doDelete','doSave');
            
            this.model.on('destroy', this.remove);
            
            //commented to use Backbone.ModelBinding to listen to model changes
            //this.model.on('change', this.render);
            
        },
        render: function(){
            var html = this.template({'service':this.model.toJSON()});
            this.$el.html(html);
            
            ModelBinding.bind(this);
            
            return this;
        },
        remove: function(){
            this.model.off('change',this.render);
            this.model.off('destroy',this.remove);
            ModelBinding.unbind(this);
            
            this.$el.remove();
        },
        doDelete: function(){
            this.model.destroy();
        },
        doSave: function(){
            this.model.save();
        }
    });
    
    var ServiceListViewClass = Backbone.View.extend({
        initialize: function(){
            _.bindAll(this, 'render');
            
            this.collection.on('add reset', this.render);
            // XXX on change and add should modify/append just that element
            
        },
        render: function(){
            this.$el.html('');
            _.each(this.collection.models,
                function(model,idx,list){
                    var view = new ServiceViewClass({'model':model});
                    view.render();
                    this.$el.append(view.el);
                },
                this);
            return this;
        }
    });
    
    
    return {
      
      'init' : function(user_id){
        
        var services = new ServicesCollection();
        services.setUserId(user_id);
        
        return {
          'render' : function(parentElem,startingServices){
            var servicesListView = new ServiceListViewClass({'collection':services});
            services.reset(_.map(startingServices,function(x){
              var model = new ServiceModel(x);
              model.setUserId(user_id);
              return model;
            }));
            
            $(parentElem).append(servicesListView.el);
          }
          ,
          'add_service' : function(){
            var newService = new ServiceModel();
            newService.setUserId(user_id);
            newService.save();
            services.add(newService);
          }
        };
      }
    }
    
});

define.amd = {};
