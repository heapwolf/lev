var completion = require('./lib/completion');
var history = require('./lib/history');
var createREPL = require('./lib/repl');
var getDB = require('./lib/db');
var locate = require('./lib/location');
var cache = require('./lib/cache');

module.exports = function(args) {

  locate(args);

  var db = getDB(args);
  var repl = createREPL(db, args, cache);

  history(repl, args);
  completion(repl, cache);

};

