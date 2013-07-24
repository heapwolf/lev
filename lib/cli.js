
var utils = require('./utils')
utils.format.raw = true
var print = utils.print

module.exports = function(opts, db) {

  if (opts.cd) {
    if (typeof opts.cd === 'boolean') return

    var sublevels = opts.cd.split('/')

    for (var s = 0, l = sublevels.length; s < l; s++) {
      db = db.sublevel.call(db, sublevels[s])
    }
  }

  if (opts.put) {
    if (typeof opts.put === 'boolean') return
    db.put(opts.key || opts.put, opts.value, print)

  } else if (opts.get) {
    if (typeof opts.get === 'boolean') return
    db.get(opts.key || opts.get, print)

  } else if (opts.createReadStream) {

    db.createReadStream(opts)
      .pipe(es.stringify())
      .pipe(process.stdout)

  } else if (opts.createWriteStream) {

    process.stdin.resume()
    process.stdin
      .pipe(es.split())
      .pipe(es.parse())
      .pipe(db.createWriteStream(opts))

  } else if (opts.batch) {

    db.batch(opts.batch, print)

  } else if (opts.del) {

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
