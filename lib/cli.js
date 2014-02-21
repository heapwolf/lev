
var utils = require('./utils')
var path = require('path')
var Client = require('./client')

utils.format.raw = true
var print = utils.print

module.exports = function(opts) {

  var client = Client(console)

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
  else if (opts.createWriteStream) {
    
    process.stdin.resume()
    process.stdin
      .pipe(es.split())
      .pipe(es.parse())
      .pipe(db.createWriteStream(opts))

  } 
  else if (opts.batch) {

    db.batch(opts.batch, print)

  } 
  else if (opts.del) { 
    db.del(opts.key || opts.del, print)
  }
  else if (!opts.location) {
  
    if (typeof db[opts] === 'function') {
      db[opts](opts)
    }
    else {
      print(null, db[opts])
    }
   
  }
}

