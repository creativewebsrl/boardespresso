
define([
    'jquery','underscore','backbone','modelbinding'
  ], function ($, _, Backbone, ModelBinding ) {
    
    var PluginModel = Backbone.Model.extend({
        defaults : {
            name : ''
        },
        url: function(){
            return '/api/plugin/'+this.get('name');
        },
        initialize : function(){
        }
    });
    
    var PluginsCollection = Backbone.Collection.extend({
        model: PluginModel,
        url : '/api/plugins'
    });
    
    
    var PluginsListViewClass = Backbone.View.extend({
        defaults : {
          id : ''
        },
        initialize: function(){
            var $elem = $('<ul/>');
            if (this.id) $elem.attr('id',this.id);
            
            this.setElement($elem);
            
            _.bindAll(this, 'render');
            
            this.collection.on('add reset', this.render);
            // XXX on change and add should modify/append just that element
            
        },
        render: function(){
            this.$el.html();
            
            _.each(this.collection.models,
                function(model,idx,list){
                    var view = new PluginsListItemViewClass({'model':model});
                    view.render();
                    this.$el.append(view.el);
                },
                this);
            return this;
        }
    });
    
    
    var PluginsListItemViewClass = Backbone.View.extend({
        tagName: "li",
        className : "",
        events : {},
        
        initialize: function(){ 
          _.bindAll(this, 'render');
        },
        render: function(){
          var pluginName = this.model.get('name');
          this.$el.html(
              $('<span/>').append(pluginName)
              .click(function(){
                $(document).trigger('new-plugin',[pluginName]);
              })
          );
          
          ModelBinding.bind(this);
          
          return this;
        },
        remove: function(){
          this.model.off('change',this.render);
          this.model.off('destroy',this.remove);
          ModelBinding.unbind(this);
          
          this.$el.remove();
        }
    });
    
    function makePluginsList(pluginsListId){
      
      var pluginsCollection = new PluginsCollection();
      var pluginsListView = new PluginsListViewClass({
        collection : pluginsCollection,
        id : pluginsListId
      });
      
      pluginsListView.render();
      
      var $pluginsList = pluginsListView.$el;
      
      pluginsCollection.fetch();
      
      return $pluginsList;
    }
    
    // get an array with the name of available plugins
    function getPlugins(cb){
      $.getJSON('/api/plugins')
      .done(function(data, textStatus, jqXHR){
        // XXX check that data is in {'success'...format}
        cb(data); 
      })
      .fail(function(jqXHR, textStatus, errorThrown){
        cb({'success':false,'message':textStatus});
      });
      
    }
    
    
    function getPlugin(pluginName,cb){
      if (!window.dboard.plugins[pluginName]) {
        require(['./plugins/'+pluginName+'/logic'],function(plugin){
          window.dboard.plugins[pluginName] = plugin;
          cb({'success':true,'message':plugin});
        });
      }
      else {
        cb({'success':true,'message':window.dboard.plugins[pluginName]});
      }
    }
    
    function getUserWidgets(user_id,cb){
        $.get('/api/widgets/'+user_id)
        .done(cb);
    }
    
    return {
        'makePluginsList' : makePluginsList,
        'getPlugin' : getPlugin,
        'getPlugins' : getPlugins,
        'getUserWidgets' : getUserWidgets
    };
    
});
