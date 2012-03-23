
var db = require('database');

module.exports = {
    'services' : {
        
        'read' : function(req,res){
            var user_id = req.params.user_id;
            console.log(req.user._id,user_id);
            if (!req.user || req.user._id != user_id) {
                res.send(403);
            }
            else return db.model('User').getUserServices(user_id,
                function(err,services){
                    console.log(req.sessionId);
                    GLOBAL['GLOB']['sio'].sockets.in(req.sessionId).emit('ok',{'lots':'of love'});
                    if (!err) res.json(services);
                    else res.send(500);
                }
            );
        }
        
    },
    'service' : {
        
        // generate a service and add it to the user
        'create' : function(req,res){
            var user_id = req.params.user_id
                description = req.body.desc || ''
                ;
            
            if (!req.user || req.user._id != user_id) {
                res.send(403);
            }
            else {
                var serviceModel = new db.model('Service'),
                    service = new serviceModel();
                
                service._id = db.ObjectId();
                service.desc = description;
                
                // monoquery
                db.model('User').update(
                    // query
                    { _id :  db.ObjectId(user_id)},
                    // update
                    { $pushAll : { services : [service] } },
                    { safe:false},
                    // callback
                    function(err){
                        if (err) return res.send(500);
                        else res.json(service);
                    }
                );
                
                /*
                 // alternatively
                db.model('User').findById(user_id,function(err,user){
                    if (err) return res.send(500);
                    else {
                        user.services.push(service);
                        user.save(function(err){
                            if (err) return res.send(500);
                            else return res.json(service);
                        });
                    }
                });
                */
                
            }
        },
        
        // send a stub object if no service_id is passed, or that service
        'read' : function(req,res){
            var user_id = req.params.user_id
                service_id = req.params.service_id;
            
            if (!req.user || req.user._id != user_id) {
                res.send(403);
            }
            else {
                
                if (!service_id) {
                    var serviceModel = new db.model('Service'),
                        stubService = new serviceModel();
                    stubService._id = undefined;
                    return res.json(stubService);
                }
                // XXX would be best to select directly the service
                // https://jira.mongodb.org/browse/SERVER-828
                else db.model('User').getUserServices(user_id,function(err,services){
                    if (err) res.send(500);
                    else {
                        var result = _.find(services,function(elem){ return elem._id==service_id });
                        if (!result) res.send(500);
                        else res.json(result);
                    }
                });
            }
        },
        
        'update' : function(req,res){
            var user_id = req.params.user_id
                service_id = req.params.service_id,
                description = req.body.desc,
                last_value = req.body.last_value 
                ;
            
            if (!req.user || req.user._id != user_id) {
                res.send(403);
            }
            
            var whatToUpdate = {};
            if (description!==undefined) {
                whatToUpdate["services.$.desc"] = description ;
            }
            if (last_value!==undefined) {
                whatToUpdate["services.$.last_value"] = last_value ;
                whatToUpdate["services.$.updated_at"] = new Date() ;
            }
            
            if (_.isEmpty(whatToUpdate)) {
                return db.model('User').getUserServices(user_id,function(err,services){
                    if (!err) res.send(services);
                    else res.send(500);
                });
            }
            else return db.model('User').update(
                // query
                { _id :  db.ObjectId(user_id),
                    services : { '$elemMatch' : { _id : db.ObjectId(service_id) } }
                },
                // update
                { $set : whatToUpdate
                },
                // callback
                function(err){
                    // XXX not atomic. Should use findAndModify instead (and return the new version)
                    if (err) return res.send(500);
                    // XXX would be best to select directly the service
                    // https://jira.mongodb.org/browse/SERVER-828
                    else db.model('User').getUserServices(user_id,function(err,services){
                        if (err) res.send(500);
                        else {
                            var result = _.find(services,function(elem){ return elem._id==service_id });
                            if (!result) res.send(500);
                            else res.json(result);
                        }
                    });
                }
            );
            
            
        },
        'delete' : function(req,res){
            var user_id = req.params.user_id
                service_id = req.params.service_id
                ;
            
            if (!req.user || req.user._id != user_id) {
                res.send(403);
            }
            else {
                db.model('User').update(
                    // query
                    {   _id :  db.ObjectId(user_id),
                        services : { '$elemMatch' : { _id : db.ObjectId(service_id) } }
                    },
                    // update (remove)
                    { '$pull' : { services: { _id : db.ObjectId(service_id) } } },
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

