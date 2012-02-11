
/*
 * GET home page.
 */

exports.index = function(req, res){
  console.log('ohi',req.user);
  res.render('index', { title: 'Express' });
};
