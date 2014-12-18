/*
 *
 * db.js
 * create in instance of levelup.
 *
 */
var level = require('level');
var multilevel = require('multilevel');
var net = require('net');
var fs = require('fs');

module.exports = function(args) {

  if (args.r) {
    var db = multilevel.client(args.manifest);
    var con = net.connect(args.port);
    con.pipe(db.createRpcStream()).pipe(con);
    return db;
  }

  return level(args.path, args);
};

