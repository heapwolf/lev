var completion = require('./lib/completion');
var history = require('./lib/history');
var createREPL = require('./lib/repl');
var getDB = require('./lib/db');
var locate = require('./lib/location');
var cache = require('./lib/cache');
var cli = require('./lib/cli');

module.exports = function(args) {

  //
  // find where the location by examining the arguments
  // and create an instance to work with.
  //
  locate(args, function (err) {
    if (err) {
      console.error(err);
      return process.exit(1);
    }
    init(args);
  });
};

function init (args) {
  var db = getDB(args);

  //
  // if any of these commands are specified as arguments
  // than the program should not be run in REPL mode.
  //
  var cliCommands = [
    'keys', 'values', 'get', 'match', 'put', 'del',
    'all', 'batch', 'length', 'start', 'end', 'limit', 'map'
  ];

  var cliMode = Object.keys(args).some(function(cmd) {
    return cliCommands.indexOf(cmd) > -1;
  });

  if (cliMode) {
    return cli(db, args);
  }

  //
  // create the instance of the repl and start it.
  //
  var repl = createREPL(db, args, cache);

  history(repl, args);
  completion(repl, cache);
};

