/*
 *
 * cli.js
 * all the functions to invoke the right leveldb methods
 * from the commandline.
 *
 */
var Tabulate = require('tabulate');
var print = require('./print');
var minimatch = require("minimatch");

var tabulate = Tabulate(process.stdout);

module.exports = function(db, args) {

  if (args.values || args.keys) {

    if (args.values) args.keys = false;
    if (args.keys) args.values = false;

    var items = [];

    db
      .createReadStream(args)
      .on('data', function(data) {
        if (args.keys) {
          return items.push(data);
        }
        else if (!args.valueEncoding ||
          args.valueEncoding == 'json') {
          process.stdout.write(JSON.stringify(data) + '\n');
        }
        else {
          process.stdout.write(data);
        }
      })
      .on('end', function() {
        if (args.keys) {
          process.stdout.write(tabulate.write(items))
        }
      });
  }
  else if (args.put) {
    db.put(args.key || args.put, args.value, print)
  }
  else if (args.get) {
    db.get(args.key || args.get, print)
  }
  else if (args.match) {
    db.createReadStream(args).on('data', function(data) {
      if (!minimatch(data.key, args.match)) return;
      if (!args.valueEncoding ||
        args.valueEncoding == 'json') {
        return process.stdout.write(data.value + '\n');
      }
      print(err, data.value);
    });
  }
  else if (args.createReadStream) {
    db.createReadStream(args).on('data', print)
  }
  else if (args.batch) {
    db.batch(args.batch, print)
  }
  else if (args.del) {
    db.del(args.key || args.del, print)
  }
  else {
    print(null, 'No valid command');
  }
};

