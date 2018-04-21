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

  // Ignore args that aren't meant to be database options
  // Start by cloning the args object so that those changes
  // don't propagate anyware else
  dbArgs = JSON.parse(JSON.stringify(args))
  delete dbArgs.limit

  return level(dbArgs.path, dbArgs)
}

