var completion = require('./lib/completion');
var history = require('./lib/history');
var createREPL = require('./lib/repl');
var getDB = require('./lib/db');
var locate = require('./lib/location');
var cache = require('./lib/cache');
var cli = require('./lib/cli');

module.exports = function(args) {

  locate(args);

  var db = getDB(args);

  var cliCommands = [
    'keys', 'values', 'get', 
    'put', 'del', 'createReadStream', 'batch'
  ];
  
  var cliMode = Object.keys(args).some(function(cmd) {
    return cliCommands.indexOf(cmd) > -1;
  });
 
  if (cliMode) {
    return cli(db, args);
  }

  var repl = createREPL(db, args, cache);

  history(repl, args);
  completion(repl, cache);

};

