
var db = require('database');

module.exports = {
    'widgets' : {
        
        // retrieve all the widgets owned by a user
        'read' : function(req,res){
            var user_id = req.params.user_id;
            
            if (!req.user || req.user._id != user_id) {
                res.send(403);
            }
            else return db.model('User').getWidgets(user_id,
                function(err,widgets){
                    if (!err) res.json(widgets);
                    else res.send(500);
                }
            );
        }
        
    },
    'widget' : {
        
        // generate a widget and add it to the user
        'create' : function(req,res){
            var user_id = req.params.user_id
                ;
            
            if (!req.user || req.user._id != user_id) {
                res.send(403);
            }
            else {
                var widgetModel = db.model('Widget'),
                    widget = new widgetModel(req.body);
                
                widget._id = db.ObjectId();
                
                // monoquery
                db.model('User').update(
                    // query
                    { _id :  db.ObjectId(user_id)},
                    // update
                    { $pushAll : { widgets : [widget] } },
                    { safe:true},
                    // callback
                    function(err){
                        if (err) return res.send(500);
                        else res.json(widget);
                    }
                );
                
                /*
                 // alternatively
                db.model('User').findById(user_id,function(err,user){
                    if (err) return res.send(500);
                    else {
                        user.widgets.push(widget);
                        user.save(function(err){
                            if (err) return res.send(500);
                            else return res.json(widget);
                        });
                    }
                });
                */
                
            }
        },
        
        // send a stub object if no widget_id is passed, or that widget
        'read' : function(req,res){
            var user_id = req.params.user_id
                widget_id = req.params.widget_id;
            
            if (!req.user || req.user._id != user_id) {
                res.send(403);
            }
            else {
                
                if (!widget_id) {
                    var widgetModel = db.model('Widget'),
                        stubwidget = new widgetModel();
                    stubwidget._id = undefined;
                    return res.json(stubwidget);
                }
                // XXX would be best to select directly the widget
                // https://jira.mongodb.org/browse/SERVER-828
                else db.model('User').getWidgets(user_id,function(err,widgets){
                    if (err) res.send(500);
                    else {
                        var result = _.find(widgets,function(elem){ return elem._id==widget_id });
                        if (!result) res.send(500);
                        else res.json(result);
                    }
                });
            }
        },
        
        'update' : function(req,res){
            var user_id = req.params.user_id
                widget_id = req.params.widget_id
                ;
            
            if (!req.user || req.user._id != user_id) {
                res.send(403);
            }
            
            var widgetModel = db.model('Widget'),
            widget = new widgetModel(req.body);
            widget.updated_at = new Date();
            
            // use orignal db connection because mongoose is using 'strict' on submodels too
            return db.conn().collection('users',function(err,collection){
              collection.update(
                // query
                {  _id :  db.ObjectId(user_id),
                   widgets : { '$elemMatch' : { _id : db.ObjectId(widget_id) } }
                },
                // update
                { $set : {'widgets.$' : widget.toJSON()}
                },
                // callback
                function(err,x){
                    // XXX not atomic. Should use findAndModify instead (and return the new version)
                    if (err) return res.send(500);
                    // XXX would be best to select directly the widget
                    // https://jira.mongodb.org/browse/SERVER-828
                    
                    // XXX slow, I should just retrieve the single widget I need
                    else db.model('User').getWidgets(user_id,function(err,widgets){
                        if (err) res.send(500);
                        else {
                            var result = _.find(widgets,function(elem){
                              return elem._id==widget_id
                            });
                            
                            if (!result) res.send(500);
                            else {
                                GLOBAL['GLOB']['sio'].sockets.in(user_id).emit('widget-update',result);
                                res.json(result);
                            }
                        }
                    });
                }
              );
            });
            
            
        },
        'delete' : function(req,res){
            var user_id = req.params.user_id
                widget_id = req.params.widget_id
                ;
            
            if (!req.user || req.user._id != user_id) {
                res.send(403);
            }
            else {
                db.model('User').update(
                    // query
                    {   _id :  db.ObjectId(user_id),
                        widgets : { '$elemMatch' : { _id : db.ObjectId(widget_id) } }
                    },
                    // update (remove)
                    { '$pull' : { widgets: { _id : db.ObjectId(widget_id) } } },
                    // callback
                    function(err){
                        if (err) return res.send(500);
                        else return res.json(true);
                    }
                );
            }
        }
    }
};

