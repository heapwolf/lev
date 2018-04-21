/*
 *
 * cli.js
 * all the functions to invoke the right leveldb methods
 * from the commandline.
 *
 */
var Tabulate = require('tabulate');
var print = require('./print');
var printAndExit = require('./print_and_exit');
var minimatch = require("minimatch");

module.exports = function(db, args) {
  if (args.start) args.gte = args.start
  if (args.end) args.lte = args.end

  var valueEncoding = args.valueEncoding || 'json'

  if (args.values || args.keys) {

    if (args.values) args.keys = false;
    if (args.keys) args.values = false;

    if (!args.line) {
      var tabulate = Tabulate(process.stdout);
      var items = [];
    }

    db
      .createReadStream(args)
      .on('data', function(data) {
        if (args.keys) {
          if (args.line) {
            process.stdout.write(data + '\n')
          }
          else {
            items.push(data);
          }
        }
        else if (valueEncoding === 'json') {
          process.stdout.write(JSON.stringify(data) + '\n');
        }
        else {
          process.stdout.write(data);
        }
      })
      .on('end', function() {
        if (args.keys && !args.line) {
          if (items.length === 0) {
            return process.exit(1);
          }
          process.stdout.write(tabulate.write(items).trim() + '\n')
        }
        process.exit(0);
      });
  }
  else if (args.match) {
    var limit = typeof args.limit === 'number' ? args.limit : Infinity
    var count = 0
    delete args.limit
    db.createReadStream(args)
      .on('data', function(data) {
        if (!minimatch(data.key, args.match)) return;
        if (++count > limit) {
          return process.exit()
        }
        if (valueEncoding === 'json') {
          return process.stdout.write(
            JSON.stringify(data) + '\n'
          );
        }
        print(null, data.value);
      })
      .on('end', process.exit);
  }
  else if (args.stream) {
    db.createReadStream(args)
      .on('data', function(data) {
        process.stdout.write(JSON.stringify(data) + '\n')
      })
      .on('error', print)
      .on('end', process.exit);
  }
  else if (args.put) {
    db.put(args.key || args.put, args.value, printAndExit)
  }
  else if (args.get) {
    db.get(args.key || args.get, printAndExit)
  }
  else if (args.del) {
    db.del(args.key || args.del, printAndExit)
  }
  else if (args.batch) {
    var batch = JSON.parse(args.batch)
    db.batch(batch, printAndExit)
  }
  else {
    printAndExit(new Error('No valid command'));
  }
};

