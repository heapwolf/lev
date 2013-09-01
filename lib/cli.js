
var utils = require('./utils')
utils.format.raw = true
var print = utils.print

module.exports = function(opts, db, tree) {

  if (opts.cd) {
    if (typeof opts.cd === 'boolean') return

    var sublevels = opts.cd.split('/')

    for (var s = 0, l = sublevels.length; s < l; s++) {
      db = db.sublevel.call(db, sublevels[s])
    }
  }
  if (opts.tree) {
    return tree.init(function(tree) {
      console.log(utils.archify(tree))
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
  
    if (typeof db[opt] === 'function') {
      db[opt](opts)
    }
    else {
      print(null, db[opt])
    }
   
  }
}

