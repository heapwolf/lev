/*
 *
 * location.js
 * tries to find the location of the database.
 *
 */

module.exports = function (argv) {

  var location = typeof argv.location === 'string';
  argv.path = location && argv.location || argv._[0];
  if (!argv.path) {
    if (cwdIsADatabase()) {
      argv.path = process.cwd();
    }
    else {
      console.error('no database found');
      return process.exit(1);
    };
  };
};

function cwdIsADatabase () {
  try {
    var CURRENT = require('fs').readFileSync('./CURRENT').toString();
    return CURRENT.split('-')[0] === 'MANIFEST';
  } catch (err) {
    return false;
  };
};

