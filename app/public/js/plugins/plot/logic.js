
define(['jquery','underscore','backbone','modelbinding','plugins/base/logic','use!rickshaw'],
    function($,_,Backbone, ModelBinding,parentPlugin,Rickshaw){
      
      var PlotModel = parentPlugin.Model.extend({
          defaults : _.extend({},parentPlugin.Model.prototype.defaults,{
              type: 'plot',
              yAxis: {'min': 0, 'max':50},
              xAxis: {'min': 0, 'max':50},
              keep_last_n_values: 100
          })
      });
      
      var PlotView = parentPlugin.WidgetView.extend({
        doRender : function(){
          
          this.$graphContainer = null;
          this.graph = null;
          
          var view = this;
          
          setTimeout(function(){
            view.$('.dataContainer').css({'padding':0,'position':'absolute','margin-top':'2em','top':0,'bottom':0,'left':0,'right':0});
            
            view.$graphContainer = view.$('.plot');
            $(window).resize(_.bind(view.onResize,view));
            
            var graph = new Rickshaw.Graph( {
                element: view.$('.plot')[0],
                series: [{
                    color: 'steelblue',
                    data: [ 
                        { x: 0, y: 40 }, 
                        { x: 1, y: 49 }, 
                        { x: 2, y: 38 }, 
                        { x: 3, y: 30 }, 
                        { x: 4, y: 32 } ]
                }]
            });
            
             // rickshaw graph resize
            graph.resize = function(width, height) {
                var svg = this.element.getElementsByTagName('svg')[0];
                
                if (width) {
                    this.width = width;
                    this.element.style.width = this.width + 'px';
                    svg.setAttribute("width", this.width);
                }
                
                if (height) {
                    this.height = height;
                    this.element.style.height = this.height + 'px';
                    svg.setAttribute("height", this.height);
                }
            }
            
            view.graph = graph;
            graph.render();
            
            setInterval(function(){view.model.set('value',[Math.random()*10,Math.random()*10]);},30);
            
          },1000);
          
          return this.template();
        },
        onResize: function(){
          this.graph.resize(this.$graphContainer.width(),this.$graphContainer.height());
        },
        doUpdateRender : function(){
          return;
        }
      });
      
      var PlotPreferencesView = parentPlugin.PreferencesView.extend({
          
      });
      
      return _.extend({},parentPlugin,{
          Model : PlotModel,
          WidgetView : PlotView,
          PreferencesView : PlotPreferencesView
      });

});

define.amd = {};