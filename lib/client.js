var multilevel = require('multilevel')
var subify = require('level-sublevel')
var Tree = require('level-subtree')
var levelup = require('level')
var reconnect = require('reconnect-net')
var exec = require('child_process').exec
var net = require('net')
var path = require('path')
var ui = require('./ui')

var level
var db

function compatify(o) {
  for(var k in o) {
    o[k] = { sublevels: compatify(o[k]) }
  }
  return o
}

exports.connect = function(info, cb) {

  if (!info) {
    ui.output.log('not enough connection information :(')
    return
  }

  if (info.local) {
    
    levelup(info.path, info, function(err, handle) {
      if (err) return cb(err)

      Tree(handle).init(function(err, t) {
        handle = subify(handle)
        handle.manifest = { sublevels: compatify(t) }
        db = level = handle
        cb(null, handle)
      })
    })
    
    return
  }

  var manifest

  if (info.manifest) {
    manifest = require(path.join(info.manifest))
    db = multilevel.client(manifest)
  }
  else {
    db = multilevel.client()
  }

  var conn = reconnect(function(stream) {
    var rpc = db.createRpcStream()
    rpc.on('error', function(){})
    stream.pipe(rpc).pipe(stream)
  }).connect(info.port) 

  conn.on('end', function(err) {
    ui.output.log('NOT OK!')
  })

  conn.on('connect', function() {
    ui.output.log('OK!', 'connected.\n')
    cb()
  })

  db.manifest = manifest
  level = db
  ui.output.log('trying to connect to', info.host, info.port)
}

exports.query = function(model, cb) {

  var count = 0

  //
  // TODO: conditional
  //

  var keys = level._parent ? ['[..]'] : []

  if (level.manifest) {
    var levels = Object.keys(level.manifest.sublevels)

    levels.forEach(function(level) {
      keys.push('[' + level + ']')
    })
  }

  ui.output.log('createReadStream(%j)', model.query)

  model.query.values = false

  level.createReadStream(model.query)
  .on('data', function(k) {
    ++count
    keys.push(k)
  })
  .on('error', function(err) {
    ui.output.log('ERROR', model.query)
    cb(err)
  })
  .on('end', function() {
    ui.output.log('OK! ' + count + ' records.\n')
    cb(null, keys)
  })
}

exports.get = function(key, cb) {
  
  ui.output.log('get("' + key + '")')
  
  level.get(key, function(err, value) {
    if (err) {
      ui.output.log('ERROR', err)
      return cb(err)
    }
    ui.output.log('OK!\n')
    cb(null, value)
  })
}

exports.del = function(key, cb) {
  
  ui.output.log('del("' + key + '")')
  
  level.del(key, function(err, value) {
    if (err) {
      ui.output.log('ERROR', err)
      return cb(err)
    }
    ui.output.log('OK!\n')
    cb(null, value)
  })
}

exports.put = function(key, val, cb) {

  if (!key || !val) return ui.output.log('ABORTED!')

  ui.output.log('put("' + key + '", "' + val + '")')

  level.put(key, val, function(err) {
    if (err) return ui.output.log('ERROR', err)
    ui.output.log('OK!\n')
    if (cb) cb()
  })
}

exports.getSublevels = function(key, cb) {

  if (!level) return

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
    ? level.manifest.sublevels
    : db.manifest.sublevels

  cb(null, walk(start))
}

exports.getInfo = function(model, cb) {

  db.db.approximateSize(model.query.start, model.query.end, function(err, size) {
    if (err) return cb(err)

    exec('df /', function (err, stdout, stderr) {
      if (err) return cb(err)

      var info = stdout.split('\n')[1].split(/\s+/)
      var disk = info[1]

      cb(err, {
        stats: db.db.getProperty('leveldb.stats'),
        size: size,
        disk: disk
      })
    })
  })
}

exports.selectSublevel = function(model, cb) {
  if (model.key == '..') {
    if (level._prefix) {
      level = level._parent
      exports.query(model, cb)
    }
    return
  }
  level = level.sublevel(model.key)
  exports.query(model, cb)
}
