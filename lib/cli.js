var utils = require('./utils')
var path = require('path')
var Tabulate = require('tabulate')
var Tree = require('level-subtree')
var tabulate = Tabulate(process.stdout)
var Client = require('./client')

utils.format.raw = true

module.exports = function(opts, model) {

  var client = Client(model, console)

  function print() {
    utils.print.apply(null, arguments)
    process.exit(0)
  }

  if (!opts.a) {
    opts.local = true
    opts.path = opts._[0]
  }

  client.connect(opts, function(err, db, tree) {

    opts = opts || {}

    if (opts.cd) {
      if (typeof opts.cd === 'boolean') return

      var newpath = 
        path.normalize(opts.cd.replace(/^\/+|\/+$/g, ''))
          .split('/')

      for (var s = 0, l = newpath.length; s < l; s++) {
        db = db.sublevel.call(db, newpath[s])
      }
    }

    if (opts.tree) {
      console.log(err || utils.archify(tree))
    }
    else if (opts.keys) {
      
      opts.values = false
      var keys = []

      db
        .createReadStream(opts)
        .on('data', function(data) {
          keys.push(data)
        })
        .on('end', function() {
          process.stdout.write(tabulate.write(keys))
          process.exit(0)
        })
    }
    else if (opts.values) {
      
      opts.keys = false
      var keys = []

      db
        .createReadStream(opts)
        .on('data', function(data) {
          keys.push(data)
        })
        .on('end', function() {
          process.stdout.write(tabulate.write(keys))
          process.exit(0)
        })
    }
    else if (opts.put) {
      db.put(opts.key || opts.put, opts.value, print)
    }
    else if (opts.get) {
      db.get(opts.key || opts.get, print)
    } 
    else if (opts.createReadStream) {
      db.createReadStream(opts).on('data', print)
    }
    else if (opts.batch) {
      db.batch(opts.batch, print)
    } 
    else if (opts.del) { 
      db.del(opts.key || opts.del, print)
    }
  })
}
