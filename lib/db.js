/*
 *
 * db.js
 * create in instance of levelup.
 *
 */
var level = require('level');

module.exports = function(args) {

  return level(args.path, args);
};

