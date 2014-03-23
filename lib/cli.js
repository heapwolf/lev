var utils = require('./utils')
var path = require('path')
var Client = require('./client')

utils.format.raw = true

module.exports = function(opts, model) {

  var client = Client(model, console)

  function print() {
    utils.print.apply(null, arguments)
    process.exit(0)
  }

  if (!opts.port) {
    opts.local = true
    opts.path = opts._[0]
  }

  client.connect(opts, function(err, db) {

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
      tree.init(function(err, newtree) {
        if (opts.cd) {
          var newpath = opts.cd.replace(/^\/+|\/+$/g, '').split('/')
          newtree = utils.walkObject(newpath, newtree)
        }
        console.log(err || utils.archify(newtree))
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
