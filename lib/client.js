var multilevel = require('multilevel')
var net = require('net')
var path = require('path')
var ui = require('./ui')

var connections = {}
var sublevel = {}
var upper = null
var lower = null

exports.createConnection = function(output) {

  var manifest
  
  var p = path.join(__dirname + '/../../../async.ly/db/manifest.json')
  manifest = require(p)

  var db = multilevel.client(manifest)
  var con = net.connect(3000)

  con.pipe(db.createRpcStream()).pipe(con)
  db.manifest = manifest
  var dbname = 'Default'
  connections[dbname] = db
}

exports.query = function(dbname, query, cb) {
  
  var db = connections[dbname]
  var keys = []
  var count = 0

  var keys = ['[..]']
  var levels = Object.keys(db.manifest.sublevels)

  levels.forEach(function(level) {
    keys.push('[' + level + ']')
  })

  ui.output.log('{yellow-fg}❯{/yellow-fg} LIST', query)

  query.values = false

  db.createReadStream(query)
  .on('data', function(k) {
    ++count
    keys.push(k)
  })
  .on('error', function(err) {
    ui.output.log('{red-fg}❯', query, '{/red-fg}')
  })
  .on('end', function() {
    cb(keys)
    ui.output.log('{blue-fg}❯{/blue-fg}', 'OK! (' + count + ' records)\n')
  })
}

exports.get = function(dbname, key, cb) {
  var db = connections[dbname]
  
  ui.output.log('{yellow-fg}❯{/yellow-fg} getting \'' + key + '\'')
  
  db.get(key, function(err, value) {
    if (err) return ui.output.log('{red-fg}❯{/red-fg}', err)
    ui.output.log('{blue-fg}❯{/blue-fg}', 'OK!\n')
    cb(null, value)
  })
}

exports.put = function(dbname, key, val, cb) {
  ui.output.log('{yellow-fg}❯{/yellow-fg} putting \'' + key + '\', \'' + val + '\'')
  db.put(key, val, function(err) {
    if (err) return ui.output.log('{red-fg}❯{/red-fg}', err)
      ui.output.log('{blue-fg}❯{/blue-fg}', 'OK!\n')
    cb()
  })
}

exports.chlev = function(key) {

}

exports.connections = connections
exports.createConnection()
