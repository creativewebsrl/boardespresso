
var fs = require('fs');

module.exports = {
    'plugins' : {
      'read' : function(req,res){
        fs.readdir(GLOB['PLUGINS_PATH'],function(err,files){
          res.json(_.map(
                          _.filter(files, function(fileName){ return fileName!='base' ;} ),
                          function(fileName){ return {'name':fileName}; }
                        ) 
                  );
        });
      }
    },
    'plugin' : {
      'read' : function(req,res){
        
        var pluginName = req.params.name
            ;
        
        if (!pluginName) {
            res.send(404);
        }
        
        else res.json({'success':true,'message':pluginName});
        
      }
    }
};