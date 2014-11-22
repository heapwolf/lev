var cache = module.exports = {};

cache.data = [];

cache.invalidate = function() {
  cache.data = [];
};

cache.regenerate = function(db, opts, cb) {

  var error;

  db
    .createReadStream(opts)
    .on('data', function(data) {
      cache.data.push(data);
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

