var multilevel = require('multilevel')
var subify = require('level-sublevel')
var Tree = require('level-subtree')
var levelup = require('level')
var reconnect = require('reconnect-net')
var exec = require('child_process').exec
var net = require('net')
var path = require('path')

function Client(model, logger) {
  
  if (!(this instanceof Client)) {
    return new Client(model, logger)
  }

  this.model = model
  this.logger = logger
  this.level
  this.db
}

module.exports = Client

function compatify(o) {
  for(var k in o) {
    o[k] = { sublevels: compatify(o[k]) }
  }
  return o
}

Client.prototype.connect = function(info, cb) {

  var that = this

  if (!info) {
    that.logger.log('NOT OK! need more connection information.')
    return
  }

  if (info.local) {
    
    levelup(info.path, info, function(err, handle) {
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

  if (info.manifest) {
    manifest = require(path.join(info.manifest))
    that.db = multilevel.client(manifest)
  }
  else {
    that.db = multilevel.client()
  }

  var conn = reconnect(function(stream) {
    var rpc = that.db.createRpcStream()
    rpc.on('error', function(){})
    stream.pipe(rpc).pipe(stream)
  }).connect(info.port) 

  conn.on('end', function(err) {
    that.logger.log('NOT OK!')
  })

  conn.on('connect', function() {
    that.logger.log('OK!', 'connected.\n')
    cb()
  })

  that.db.manifest = manifest
  that.level = that.db
  that.logger.log('trying to connect to', info.host, info.port)
}

Client.prototype.query = function(cb) {

  var count = 0
  var that = this

  //
  // TODO: conditional
  //

  var keys = that.level._parent ? ['[..]'] : []

  if (that.level.manifest) {
    var levels = Object.keys(that.level.manifest.sublevels)

    levels.forEach(function(level) {
      keys.push('[' + level + ']')
    })
  }

  that.logger.log('createReadStream(%j)', that.model.query)

  that.model.query.values = false

  that.level.createReadStream(that.model.query)
  .on('data', function(k) {
    ++count
    keys.push(k)
  })
  .on('error', function(err) {
    that.logger.log('ERROR', that.model.query)
    cb(err)
  })
  .on('end', function() {
    that.logger.log('OK! ' + count + ' records.\n')
    cb(null, keys)
  })
}

Client.prototype.get = function(key, cb) {

  var that = this

  that.logger.log('get("' + key + '")')
  
  this.level.get(key, function(err, value) {
    if (err) {
      that.logger.log('ERROR', err)
      return cb(err)
    }
    that.logger.log('OK!\n')
    cb(null, value)
  })
}

Client.prototype.del = function(key, cb) {
  
  var that = this

  that.logger.log('del("' + key + '")')
  
  this.level.del(key, function(err, value) {
    if (err) {
      that.logger.log('ERROR', err)
      return cb(err)
    }
    that.logger.log('OK!\n')
    cb(null, value)
  })
}

Client.prototype.put = function(key, val, cb) {

  var that = this

  if (!key || !val) return that.logger.log('ABORTED!')

  that.logger.log('put("' + key + '", "' + val + '")')

  this.level.put(key, val, function(err) {
    if (err) return that.logger.log('ERROR', err)
    that.logger.log('OK!\n')
    if (cb) cb()
  })
}

Client.prototype.getSublevels = function(key, cb) {

  if (!this.level) return

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

  var that = this
  var start = that.model.query.start
  var end = that.model.query.end

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

  if (this.model.key == '..') {
    if (this.level._prefix) {
      this.level = this.level._parent
      this.query(cb)
    }
    return
  }
  this.level = this.level.sublevel(this.model.key)
  this.query(cb)
}
