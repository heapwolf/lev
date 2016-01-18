/*
 *
 * cahce.js
 * save the keys from the readstream into an
 * array so that they can be autocompleted and suggested.
 *
 */
var cache = module.exports = {};
var bytewise = require('bytewise')

cache.data = [];

cache.invalidate = function() {
  cache.data = [];
};

cache.regenerate = function(db, opts, cb) {

  var error;

  db
    .createReadStream(opts)
    .on('data', function(data) {
      cache.data.push(data.key);
    })
    .on('error', function(err) {
      error = err;
      cb(error);
    })
    .on('end', function() {
      if (error) return;
      cb();
    });
};

