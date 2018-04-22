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

  if (args.all || args.values || args.keys || args.match || args.length) {

    var valueEncoding = args.valueEncoding || 'json';
    if (args.start) args.gte = args.start;
    if (args.end) args.lte = args.end;

    var values = args.values;
    var keys = args.keys;
    var limit = typeof args.limit === 'number' ? args.limit : Infinity;
    var count = 0;

    if (args.match) {
      delete args.values;
      delete args.keys;
      delete args.limit;
    }
    else if (args.length) {
      args.keys = true
    }

    if (args.keys) args.values = false
    if (args.values) args.keys = false


    var tabulate;
    if (keys && !args.line) {
      tabulate = Tabulate(process.stdout);
      var items = [];
    }

    db.createReadStream(args)
      .on('data', function(data) {
        if (args.match && !minimatch(data.key, args.match)) return;

        if (++count > limit) {
          count--
          return this.emit('end');
        }

        if (args.length) {
          return
        }

        if (args.match) {
          if (keys) data = data.key;
          if (values) data = data.value;
        }

        if (tabulate) {
          items.push(data);
        }
        else if (valueEncoding === 'json') {
          if (typeof data !== 'string') data = JSON.stringify(data);
          process.stdout.write(data + '\n');
        }
        else {
          process.stdout.write(data);
        }
      })
      .on('error', print)
      .on('end', function() {
        if (args.length){
          process.stdout.write(count + '\n');
        }
        else if (tabulate && items.length > 0) {
          process.stdout.write(tabulate.write(items).trim() + '\n');
        }
        var exitCode = count > 0 ? 0 : 1
        process.exit(exitCode);
      });
  }
  else if (args.put) {
    db.put(args.key || args.put, args.value, printAndExit);
  }
  else if (args.get) {
    db.get(args.key || args.get, printAndExit);
  }
  else if (args.del) {
    db.del(args.key || args.del, printAndExit);
  }
  else if (args.batch) {
    var batch = JSON.parse(args.batch);
    db.batch(batch, printAndExit);
  }
  else {
    printAndExit(new Error('No valid command'));
  }
};

