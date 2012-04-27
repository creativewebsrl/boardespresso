
define(['jquery','underscore','backbone','modelbinding','plugins/base/logic','use!rickshaw'],
    function($,_,Backbone, ModelBinding,parentPlugin,Rickshaw){
      
      var PlotModel = parentPlugin.Model.extend({
          defaults : _.extend({},parentPlugin.Model.prototype.defaults,{
              type: 'plot',
              yAxis: {'min': 0, 'max':50},
              xAxis: {'min': 0, 'max':50},
              keep_last_n_values: 20,
              
              width: 6,
              height: 7
          })
      });
      
      Rickshaw.Graph.Axis.X = function(args) {
      
          var self = this;
      
          this.graph = args.graph;
          this.elements = [];
          this.ticksTreatment = args.ticksTreatment || 'plain';
          
          this.tickOffsets = function() {

              var domain = this.graph.x.domain();
      
              var unit = {
                'formatter': function(value){ return value.toFixed(0); },
                'render':function(){ console.debug('x unit render'); }
              };
              
              var parts = 4;
              var step = Math.ceil((domain[1] - domain[0]) / parts);
              
              var runningTick = domain[0];
              
              var offsets = [];
      
              for (var i = 0; i < parts; i++) {
                  tickValue = runningTick;
                  runningTick = tickValue + step;
                  offsets.push( { value: tickValue, unit: unit } );
              }
              
              return offsets;
          };
          
          this.render = function() {
      
              this.elements.forEach( function(e) {
                  e.parentNode.removeChild(e);
              } );
      
              this.elements = [];
      
              var offsets = this.tickOffsets();
      
              offsets.forEach( function(o) {
                
                  if (self.graph.x(o.value) > self.graph.x.range()[1]) return;
          
                  var element = document.createElement('div');
                  element.style.left = self.graph.x(o.value) + 'px';
                  element.classList.add('x_tick');
                  element.classList.add(self.ticksTreatment);
      
                  var title = document.createElement('div');
                  title.classList.add('title');
                  title.innerHTML = o.unit.formatter(o.value);
                  element.appendChild(title);
                  
                  self.graph.element.appendChild(element);
                  self.elements.push(element);
      
              } );
          };
      
          this.graph.onUpdate( function() { self.render() } );
      };
      
      var PlotView = parentPlugin.WidgetView.extend({
        _renderAfterDomInsertion: function(){
          this.$('.dataContainer').css({'padding':0,'position':'absolute','margin-top':'2em','top':0,'bottom':0,'left':0,'right':0});
            
          this.$graphContainer = this.$('.plot');
          
          if (_.isEmpty(this.model.get('last_values'))) {
            this.model.set('value',{x:0,y:0});
          }
          
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
                  data: this.model.get('last_values')
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
          
          var hoverDetail = new Rickshaw.Graph.HoverDetail({
              graph: graph,
              xFormatter: function(x){
                return x.toFixed(2);
              }
          });
          
          var legend = new Rickshaw.Graph.Legend( {
              graph: graph,
              element: document.getElementById('legend')
          
          } );
          
          if (graph.series.length > 1) {
            var shelving = new Rickshaw.Graph.Behavior.Series.Toggle( {
                graph: graph,
                legend: legend
            } );
          }
          
          var ticksTreatment = 'glow';
          
          var xAxis = new Rickshaw.Graph.Axis.X( {
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
