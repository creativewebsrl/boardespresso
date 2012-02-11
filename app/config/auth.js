
// do not set sensitive data here. Use a .local.js file to overwrite/add values
// (and make sure that your scm is ignoring it)

module.exports = {
  'everyauth': {
  
  },

  'password' : {
     'require_email' : true,
     'active_default' : false,
     'username_min_length' : 5,
     'password_min_length' : 3
  }
};

// Say this is foo.js. We're going to update it with values found in foo.local.js
var localConf = module.filename.slice(0,-2)+'local.js';
try {
  _.extend(module.exports,require(localConf));
} catch(e) {
  console.log('Couldn\'t load '+/[^\/\\]+$/.exec(localConf),e);
}
