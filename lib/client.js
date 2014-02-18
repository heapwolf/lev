var multilevel = require('multilevel')
var reconnect = require('reconnect-net')
var net = require('net')
var path = require('path')
var ui = require('./ui')

var level
var sublevel = {}
var upper = null
var lower = null

exports.connect = function(info, cb) {

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
  
  var keys = []
  var count = 0

  //
  // TODO: conditional
  //
  var keys = ['[..]']

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

exports.get = function(levelname, key, cb) {
  
  ui.output.log('get("' + key + '")')
  
  level.get(key, function(err, value) {
    if (err) return ui.output.log('ERROR', err)
    ui.output.log('OK!\n')
    cb(null, value)
  })
}

exports.put = function(levelname, key, val, cb) {

  try {
    val = JSON.stringify(val)
  }
  catch(ex) {
  }

  ui.output.log('put("' + key + '", "' + val + '")')

  level.put(key, val, function(err) {
    if (err) return ui.output.log('ERROR', err)
      ui.output.log('OK!\n')
    cb()
  })
}

exports.getSublevels = function(key) {

  if (!db) return

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

  return walk(start)
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

exports.chlev = function(key) {

}
