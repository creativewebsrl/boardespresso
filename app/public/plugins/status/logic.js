
if (!window.plugins) window.plugins = {};

$(document).ready(function($){
    
    var plugin = {
        'name' : 'status',
        'getWidgetTemplate' : function(cb){
            if (this._template_widget) cb(this._template_widget);
            else {
                $.get('/plugins/'+(this.name)+'/template_widget.html')
                .done(function(data, textStatus, jqXHR){
                    this._template_widget = data;
                    cb(data);
                });
            }
        }
        ,'getConfTemplate' : function(cb){
            if (this._template_conf) cb(this._template_conf);
            else {
                $.get('/plugins/'+(this.name)+'/template_conf.html')
                .done(function(data, textStatus, jqXHR){
                    this._template_conf = data;
                    cb(data);
                });
            }
        }
    };
    
    var WidgetConfModel = Backbone.Model.extend({
        defaults : {
            _id : null,
            label : "title",
            
            value : null,
            last_values : [null],
            keep_last_n_values : 2,
            
            service_id: null,
            url: null,
            
            set_error_after_n_seconds: 10 // seconds 
        },
        idAttribute: '_id',
        url: function(){
            var _id = this.get('_id');
            return '/api/service/'+user_id+(_id ? '/'+_id : '');
        },
        initialize : function(){
            
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
    
    var CustomWidgetConfModel = WidgetConfModel.extend({
        defaults : _.extend({},WidgetConfModel.prototype.defaults,{
            
            show_text_value : true,
            show_visual_alarm : true,
            show_direction : true,
            
            treshold_warn : null,
            treshold_alarm : 100,
            
            min_value : 0,
            max_value : Infinity
        })
    });
    
    var StatusViewClass = Backbone.View.extend({
        tagName: "div",
        className : "",
        
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
            console.log('rendering');
            
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
            this.$el.html(html);
            
            //uncomment to use Backbone.ModelBinding to listen to model changes
            //Backbone.ModelBinding.bind(this);
            
            return this;
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
    
    
    plugin.getWidgetTemplate(function(templateHtml){
        var instConfModel = new CustomWidgetConfModel();
        
        var statusWidget = new StatusViewClass({
            'model':instConfModel,
            'template': templateHtml
        });
        statusWidget.render();
        $("#left-side").append(statusWidget.el);
    });
    
    
    
    
});