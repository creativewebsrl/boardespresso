
define(['jquery','underscore','backbone','modelbinding','plugins/base/logic'],
    function($,_,Backbone, ModelBinding,parentPlugin){
      
      if ( !Date.prototype.toISOString ) {
          ( function() {
            
              function pad(number) {  
                  var r = String(number);  
                  if ( r.length === 1 ) {  
                      r = '0' + r;  
                  }  
                  return r;  
              }  
         
              Date.prototype.toISOString = function() {  
                  return this.getUTCFullYear()  
                      + '-' + pad( this.getUTCMonth() + 1 )  
                      + '-' + pad( this.getUTCDate() )  
                      + 'T' + pad( this.getUTCHours() )  
                      + ':' + pad( this.getUTCMinutes() )  
                      + ':' + pad( this.getUTCSeconds() )  
                      + '.' + String( (this.getUTCMilliseconds()/1000).toFixed(3) ).slice( 2, 5 )  
                      + 'Z';  
              };  
          
          }() );  
      }
      
      function formatDate(date){
        if (!date) return '';
        
        return date.getFullYear() +
              '-' +
              ('0'+date.getMonth()).slice(-2) +
              '-' +
              ('0'+date.getDate()).slice(-2) +
              ' ' +
              ('0'+date.getHours()).slice(-2) +
              ':' +
              ('0'+date.getMinutes()).slice(-2) +
              ':' +
              ('0'+date.getSeconds()).slice(-2)
        ;
      }
      
      
      // Retrieve feed from <url>, returning them as an array passed to the <callback> function
      // The feeds are ordered from the oldest to the newest
      // If <since> (a date object) is passed only feeds newer than that date are returned
      function retrieveFeed(url,since,callback){
        if (typeof since === 'function') {
          callback = since;
          since = null;
        }
        
        var protocol = window.location.protocol;
        
        // Just a note to remember that we could also discover rss in pages, for future improvements
        // http://query.yahooapis.com/v1/public/yql/psychemedia/feedautodetect?url=http://abc.xyz&format=json
        
        var yql_base_uri = protocol+'//query.yahooapis.com/v1/public/yql',
            query = 'SELECT entry FROM feednormalizer WHERE url="'+url+'" and output="atom_1.0" '+
                    (since ? 'and entry.updated > "'+since.toISOString()+'"' : '')+
                    '| unique(field="entry.title") | sort(field="entry.updated", descending="false")',
            queryUrl = yql_base_uri + '?q='+encodeURIComponent(query)+'&format=json';
        
        
        function normalizeEntry(entry,feedAuthor){
          var currDate = new Date(),
              newEntry = null;
          
          newEntry = {
            // required
            'id' : entry.id,
            'title' : entry.title ? ($.type(entry.title)==='object' ? (entry.title.content || '') : entry.title) : '',
            'updated' : entry.updated ? new Date(entry.updated) : currDate,
            // recommended
            'author' : entry.author ? ($.type(entry.author)==='object' ? (entry.author.name || '') : ''+entry.author) : (feedAuthor || ''),
            'link' : $.trim(entry.link ? ($.type(entry.link)==='object' ? (entry.link.href || '') : ''+entry.link) : ''),
            /* 'links' : entry.links && _.map(entry.links,function(link){return link.href;}) || [], */
            'content' : entry.content ? ($.type(entry.content)==='object' ? (entry.content.content || '') : ''+entry.content)
                                      : '',
            'summary' : entry.summary ? ($.type(entry.summary)==='object' ? (entry.summary.content  || '') : ''+entry.summary)
                                      : (entry.description ? ($.type(entry.description)==='object'
                                                              ? (entry.description.content || '')
                                                              : ''+entry.description
                                                             )
                                                           : '')
          };
          
          // optional
          newEntry['published'] = entry.published ? new Date(entry.published) : newEntry.updated;
          
          if (!newEntry['title'] && (newEntry.summary || newEntry.content) ) {
            newEntry['title'] = $('<div/>').html(newEntry.summary || newEntry.content).text().slice(0,150);
          }
          
          // force an id if missing
          if (!newEntry['id']) newEntry['id'] = newEntry['title'];
          
          return newEntry;
        }
        
        $.ajax(queryUrl,{
          dataType: 'json'
        })
        .success(function(data, textStatus, jqXHR){
          
          if (data.errors) {
            callback({'success':false,message:data.errors});
          }
          else if (data.query.results && data.query.results.feed) {
            
            var feeds = [],
              entry = null;
            
            // feed can be either an array of entry objects [{entry:{title:''}},...]
            // or an object with an entry array {entry:[{title:''}]}
            
            if ($.isArray(data.query.results.feed)) {
              for (var i=0,il=data.query.results.feed.length;i<il;i++){
                entry = normalizeEntry(data.query.results.feed[i].entry);
                
                // skip entries without content
                if (! (entry.summary || entry.content)) continue;
                
                feeds.push(entry);
              }
            } else {
              for (var i=0,il=data.query.results.feed.entry.length;i<il;i++){
                entry = normalizeEntry(data.query.results.feed.entry[i]);
                
                // skip entries without content
                if (! (entry.summary || entry.content)) continue;
                
                feeds.push(entry);
              }
            }
            
            callback({'success':true,message:feeds});
          }
          
        });
      }
      
      var FeedModel = parentPlugin.Model.extend({
          defaults : _.extend({},parentPlugin.Model.prototype.defaults,{
              type: 'feed',
              
              keep_last_n_values: 10,
              
              poll_frequency : 60,
              
              width: 5,
              height: 4
          }),
          initialize : function(options){
            options = _.extend(
                {'can_sync' : true,
                 'sync_only_by_url' : true
                },
                options || {}
            );
            parentPlugin.Model.prototype.initialize.call(this,options);
          }
      });
      
      var FeedView = parentPlugin.WidgetView.extend({
        initialize : function(options) {
          this._latestEntries = [];
          this._dateOfMostRecentEntry = null;
          
          var view = this;
          setInterval(function(){
            if (view.model.get('url')) {
              retrieveFeed(view.model.get('url'),view._dateOfMostRecentEntry,_.bind(view._onFeedRead,view));
            }
            
          },(view.model.get('poll_frequency') || 60)*1000);
          parentPlugin.WidgetView.prototype.initialize.call(this,options);
        },
        _onFeedRead : function(data){
          if (data.success) {
            var start = 0,
                end = 0;
            
            // we can keep at most n values, so it's better to discard or ignore the entries in excess
            if (data.message.length > this.model.get('keep_last_n_values')) {
              start = data.message.length - this.model.get('keep_last_n_values');
              end = data.message.length;
            } else {
              start = 0;
              end = data.message.length;
            }
            
            this._latestEntries = [];
            for (var i=start;i<end;i++){
               // add them one by one so that our last_values FIFO queue works correctly
              this.model.set('value',data.message[i],{silent:true});
              this._latestEntries.push(data.message[i]);
              this._dateOfMostRecentEntry = new Date(data.message[i].published);
            }
            
            if (this._latestEntries.length) this.model.set('updated_at',new Date());
            
          } else {
            console.error(data.message); // XXX need serious error handling
          }
          
        },
        doRender : function(){
          if (this.model.get('url')) {
            var view = this;
            setTimeout(function(){
                retrieveFeed(view.model.get('url'),_.bind(view._onFeedRead,view));
            },2*1000); // wait some seconds before loading the feed for the first time // XXX find a better solution
          }
          
          return this.template({});
        },
        doUpdateRender : function(){
          
          var $dummyItem = this.$('.dummy .item'),
              $item = null,
              entry = null,
              title;
          
          // ### we can show at most n elements, so we remove now the items that are going to rotate out ###
          var currentItems = this.$('.feed .item'),
              entriesToKeep = 0;
          
          if ((currentItems.length + this._latestEntries.length) >= this.model.get('keep_last_n_values')) {
            entriesToKeep = this.model.get('keep_last_n_values') - this._latestEntries.length;
            for (var i=currentItems.length-1; i >= entriesToKeep ;i--) {
              $(currentItems[i]).remove();
            }
            
          }
          // ################################### //
          
          // add the new entries
          for (var i=0,il=this._latestEntries.length;i<il;i++) {
            
            entry = this._latestEntries[i];
            $item = $dummyItem.clone();
            
            title = entry.title || 'News';
            
            // link the title only if there isn't yet something similar to an anchor
            if (entry.link && title.indexOf('<a ')<0) {
              title = $('<a />').attr({'href':entry.link,'target':'_blank'}).html(title);
            }
            
            $item.find('.title').html(title);
            $item.find('.message').html($('<div/>').html(entry.summary || entry.content).text().slice(0,250));
            $item.find('.date').html(formatDate(entry.published));
            
            this.$('.feed').prepend($item);
          }
          
          this._latestEntries = [];
          
        }
      });
      
      var FeedPreferencesView = parentPlugin.PreferencesView.extend({
          
      });
      
      return _.extend({},parentPlugin,{
          Model : FeedModel,
          WidgetView : FeedView,
          PreferencesView : FeedPreferencesView
      });

});

define.amd = {};