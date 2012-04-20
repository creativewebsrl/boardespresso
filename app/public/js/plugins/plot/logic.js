
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
        _renderAfterDomInsertion: function(){
          this.$('.dataContainer').css({'padding':0,'position':'absolute','margin-top':'2em','top':0,'bottom':0,'left':0,'right':0});
            
          this.$graphContainer = this.$('.plot');
          
          for(var i=0;i<100;i++) this.model.set('value',{x:i,y:i});
          
          var graph = new Rickshaw.Graph( {
              element: this.$('.plot')[0],
              renderer: 'line',
              series: [{
                  color: '#30c020',
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
          }
          
          this.graph = graph;
          graph.render();
          var k=0, view = this;
          setInterval(function(){
            //console.log('set1');
            view.model.set('value',{x: k+++100,y:Math.random()*10});
            
            view.model.trigger('change');
            //console.log('set2');
          },30);
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