var util = require('util');

module.exports = function print(err, val) {

  var msg = (err && err.message || val || 'OK');
  console.log(util.inspect(msg));
}

