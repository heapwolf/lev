
var print = require('./utils').print

module.exports = function(opts, db) {

  if (opts.sub) {
    if (typeof opts.sub === 'boolean') return
    db = db.sublevel.apply(db, opts.sub)
  }

  if (opts.put) {

    if (typeof opts.put === 'boolean') return
    return db.put(opts.key || opts.put, opts.value, print)

  } else if (opts.get) {

    if (typeof opts.get === 'boolean') return
    return db.get(opts.key || opts.get, print)

  } else if (opts.createReadStream) {

    return db.createReadStream(opts)
      .pipe(es.stringify())
      .pipe(process.stdout)

  } else if (opts.createWriteStream) {

    process.stdin.resume()
    return process.stdin
      .pipe(es.split())
      .pipe(es.parse())
      .pipe(db.createWriteStream(opts))

  } else if (opts.batch) {

    return db.batch(opts.batch, print)

  } else if (opts.del) {

    return db.del(opts.key || opts.del, print)
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
