/*
 *
 * db.js
 * create in instance of levelup.
 *
 */
var level = require('level-party')
var bytewise = require('bytewise')

module.exports = function(args) {
  //if (!args.keyEncoding) {
  //  args.keyEncoding = bytewise
  //}
  return level(args.path, args)
}

