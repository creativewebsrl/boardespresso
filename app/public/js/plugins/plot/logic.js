
define(['jquery','underscore','backbone','modelbinding','plugins/base/logic','use!rickshaw'],
    function($,_,Backbone, ModelBinding,parentPlugin,Rickshaw){
      
      var PlotModel = parentPlugin.Model.extend({
          defaults : _.extend({},parentPlugin.Model.prototype.defaults,{
              type: 'plot',
              yAxis: {'min': 0, 'max':50},
              xAxis: {'min': 0, 'max':50},
              keep_last_n_values: 100,
              
              width: 6,
              height: 7
          })
      });
      
      var PlotView = parentPlugin.WidgetView.extend({
        _renderAfterDomInsertion: function(){
          this.$('.dataContainer').css({'padding':0,'position':'absolute','margin-top':'2em','top':0,'bottom':0,'left':0,'right':0});
            
          this.$graphContainer = this.$('.plot');
          
          for(var i=0;i<100;i++) this.model.set('value',{x:i,y:i});
          
          var graph = new Rickshaw.Graph( {
              element: this.$('.plot')[0],
              renderer: 'line',
              padding: {
                  top: 0.05,
                  bottom: 0.05
              },
              series: [{
                  color: '#30c020',
                  name: 'example',
                  data: this.model.get('last_values')/*[ 
                      { x: 0, y: 40 }, 
                      { x: 1, y: 49 }, 
                      { x: 2, y: 38 }, 
                      { x: 3, y: 30 }, 
                      { x: 4, y: 32 } ]*/
              }]
          });
          
           // rickshaw graph resize
          graph.resize = function(width, height) {
              var svg = this.element.getElementsByTagName('svg')[0];
              
              if (width) {
                  this.width = width;
                  //this.element.style.width = this.width + 'px'; // no need, is 100%
                  svg.setAttribute("width", this.width);
              }
              
              if (height) {
                  this.height = height;
                  //this.element.style.height = this.height + 'px'; // no need, is 100%
                  svg.setAttribute("height", this.height);
              }
              
              this.update();
          };
          
          var hoverDetail = new Rickshaw.Graph.HoverDetail( {
              graph: graph
          } );
          
          var legend = new Rickshaw.Graph.Legend( {
              graph: graph,
              element: document.getElementById('legend')
          
          } );
          
          var shelving = new Rickshaw.Graph.Behavior.Series.Toggle( {
              graph: graph,
              legend: legend
          } );
          
          
          
          var ticksTreatment = 'glow';
          
          var xAxis = new Rickshaw.Graph.Axis.Time( {
              graph: graph,
              ticksTreatment: ticksTreatment
          } );
          
          xAxis.render();
          
          var yAxis = new Rickshaw.Graph.Axis.Y( {
              graph: graph,
              ticksTreatment: ticksTreatment
          } );
          
          yAxis.render();
          
          this.graph = graph;
          graph.render();
          var k=0, view = this;
          /*
          setInterval(function(){
            //console.log('set1');
            view.model.set('value',{x: k+++100,y:Math.random()*10});
            
            view.model.trigger('change');
            //console.log('set2');
          },400);*/
        },
        doRender : function(){
          this.$graphContainer = null;
          this.graph = null;
          return this.template();
        },
        doOnBoxInserted: function(){
          this._renderAfterDomInsertion();
        },
        doOnResizeEnd: function(){
          this.graph.resize(this.$graphContainer.width(),this.$graphContainer.height());
        },
        doUpdateRender : function(){
          //console.log(this.model.get('last_values'));
          //console.log('up');
          if (this.graph) this.graph.update();
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