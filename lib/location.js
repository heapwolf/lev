/*
 *
 * location.js
 * tries to find the location of the database.
 *
 */
module.exports = function (argv) {

  var location = typeof argv.location === 'string';
  argv.path = location && argv.location || argv._[0] || process.cwd();
};

