var Tabulate = require('tabulate');
var print = require('./print');

var tabulate = Tabulate(process.stdout);

module.exports = function(db, args) {

  if (args.values || args.keys) {
    
    if (args.values) args.keys = false;
    if (args.keys) args.values = false;

    var items = [];

    db
      .createReadStream(args)
      .on('data', function(data) {
        items.push(data)
      })
      .on('end', function() {
        process.stdout.write(tabulate.write(items))
      });
  }
  else if (args.put) {
    db.put(args.key || args.put, args.value, print)
  }
  else if (args.get) {
    db.get(args.key || args.get, print)
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

