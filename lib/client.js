var ASSERT = require('assert').ok
var multilevel = require('multilevel')
var subify = require('level-sublevel')
var Tree = require('level-subtree')
var levelup = require('level')
var reconnect = require('reconnect-net')
var exec = require('child_process').exec
var net = require('net')
var path = require('path')

//
// Client is responsible for logging to the correct sublevel
// using the correct logger using the user's configuration.
//
function Client(config, logger) {

  if (!(this instanceof Client)) {
    return new Client(config, logger)
  }

  this.config = config
  this.logger = logger
  this.level
  this.db
}

module.exports = Client

//
// multilevel expects a data structure 
//
function compatify(o) {
  for(var k in o) {
    o[k] = { sublevels: compatify(o[k]) }
  }
  return o
}

Client.prototype.connect = function(opts, cb) {

  var that = this

  if (!opts) {
    this.logger.log('NOT OK! need more connection information.')
    cb(new Error('ECONNREFUSED'))
    return
  }

  if (opts.local) {

    levelup(opts.path, opts, function(err, handle) {
      if (err) return cb(err)

      Tree(handle).init(function(err, t) {
        handle = subify(handle)
        handle.manifest = { sublevels: compatify(t) }
        that.db = that.level = handle
        cb(null, handle)
      })
    })
    return
  }

  var manifest
  var address = opts.a ? opts.a.split(':') : null
  var port = address ? address[address.length -1] : opts.port
  var host = '127.0.0.1'

  if (address && address.length == 2) {
    host = address[0]
  }

  if (opts.manifest) {
    manifest = require(path.join(opts.manifest))
    that.db = multilevel.client(manifest)
  }
  else {
    that.db = multilevel.client()
  }

  var conn = reconnect(function(stream) {
    var rpc = that.db.createRpcStream()
    rpc.on('error', function(){})
    stream.pipe(rpc).pipe(stream)
  }).connect(port) 

  conn.on('end', function() {
    that.logger.log('connection closed.\n')
  })

  conn.on('connect', function() {
    that.logger.log('connected.\n')
    cb(null, that.level)
  })

  that.db.manifest = manifest
  that.level = that.db
  that.logger.log('trying to connect to', host, port)
  return conn
}

Client.prototype.query = function(cb) {

  if (!this.level) {
    this.logger.log('not connected')
    return cb(new Error('ENOTCONN'))
  }

  var count = 0
  var that = this

  var keys = that.level._parent ? ['[..]'] : []

  if (that.level.manifest && that.level.manifest.sublevels) {
    var levels = Object.keys(that.level.manifest.sublevels)

    levels.forEach(function(level) {
      keys.push('[' + level + ']')
    })
  }

  that.logger.log('READ %j', that.config.query)

  that.config.query.values = false

  that.level.createReadStream(that.config.query)
  .on('data', function(k) {
    ++count
    keys.push(k)
  })
  .on('error', function(err) {
    that.logger.log('NOT OK!', that.config.query)
    cb(err)
  })
  .on('end', function() {
    that.logger.log('OK! ' + count + ' records.\n')
    cb(null, keys)
  })
}

Client.prototype.get = function(key, cb) {

  ASSERT(!!key)

  var that = this

  that.logger.log('GET %s', key)
  
  this.level.get(key, function(err, value) {
    if (err) {
      that.logger.log('NOT OK! %s', err.message)
      return cb(err)
    }
    that.logger.log('OK!\n')
    cb(null, value)
  })
}

Client.prototype.del = function(key, cb) {
  
  ASSERT(!!key)

  var that = this

  that.logger.log('DEL %s', key)
  
  this.level.del(key, function(err, value) {
    if (err) {
      that.logger.log('NOT OK!', err.message)
      return cb(err)
    }
    that.logger.log('OK!\n')
    cb(null, value)
  })
}

Client.prototype.put = function(key, val, cb) {

  var that = this

  ASSERT(!!key)
  ASSERT(!!val)

  var msg = 'PUT %s ' + (typeof val == 'object' ? '%s' : '%j')
  that.logger.log(msg, key, val)

  this.level.put(key, val, function(err) {
    if (err) return that.logger.log('NOT OK!', err.message)
    that.logger.log('OK!\n')
    if (cb) cb()
  })
}

Client.prototype.getSublevels = function(key, cb) {

  if (!this.level) {
    this.logger.log('not connected')
    return cb(new Error('ENOTCONN'))
  }

  function walk(sublevels) {

    var o = {}
    for (var level in sublevels) {
      o[level] = {}
      if (sublevels[level].sublevels) {
        o[level] = walk(sublevels[level].sublevels)
      }
    }
    return o
  }

  var start = key
    ? this.level.manifest.sublevels
    : this.db.manifest.sublevels

  cb(null, walk(start))
}

Client.prototype.getInfo = function(cb) {

  if (!this.db || !this.db.db) {
    this.logger.log('not connected')
    return cb(new Error('ENOTCONN'))
  }

  var that = this

  var start = that.config.query.start
  var end = that.config.query.end

  that.db.db.approximateSize(start, end, function(err, size) {
    if (err) return cb(err)

    exec('df /', function (err, stdout, stderr) {
      if (err) return cb(err)

      var info = stdout.split('\n')[1].split(/\s+/)
      var disk = info[1]

      cb(err, {
        stats: that.db.db.getProperty('leveldb.stats'),
        size: size,
        disk: disk
      })
    })
  })
}

Client.prototype.selectSublevel = function(cb) {

  if (this.config.key == '..') {
    if (this.level._prefix) {
      this.level = this.level._parent
      this.query(cb)
    }
    return
  }
  this.level = this.level.sublevel(this.config.key)
  this.query(cb)
}
