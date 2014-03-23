var path = require('path')
var fs = require('fs')
var net = require('net')
var cp = require('child_process')
var spawn = cp.spawn
var exec = cp.exec

var tap = require('tap')
var level = require('level')
var multilevel = require('multilevel')
var manifestify = require('level-manifest')
var rimraf = require('rimraf')

var fixtures_path = path.join(__dirname + '/../fixtures/db')
var manifest_path = path.join(fixtures_path + '/manifest.json')
var defaults = { createIfMissing: true, valueEncoding: 'json' }

var test = tap.test
var db

var load = Array
  .apply(null, Array(1024))
  .map(function(v, i) { 

    return {
      type: 'put',
      key: 'key_' + (++i),
      value: { 
        index: i,
        data: Math.random().toString(35).slice(2)
      }
    }
  })

test('Test usage message', function(t) {

  t.plan(1)
  var c = 'lev -h'

  exec(c, function(err, stdout, stderr) {
    t.ok(stdout.indexOf('USAGE: lev') > -1, 'usage prints')
    t.end()
  })
})

test('Only create a database when told to do so', function(t) {

  t.plan(1)
  var c = 'lev .'

  exec(c, function(err, stdout, stderr) {
    t.ok(stderr.indexOf('-c') > -1, 'usage prints')
    t.end()
  })
})

test('Create a sample database and manifest', function(t) {

  rimraf(fixtures_path, function(err) {
    t.ok(!err, 'removed cruft')
    db = level(fixtures_path, defaults)
    fs.writeFileSync(manifest_path, JSON.stringify(manifestify(db)))
    t.end()
  })
})

test('Load a new database with some data', function(t) {

  t.plan(1)

  db.batch(load, function(err) {

    t.ok(!err, 'done batching')
    db.close()
    t.end()
  })
})

test('get a key', function(t) {

  t.plan(1)
  var c = 'lev ' + fixtures_path + ' --get key_1 -q'

  exec(c, function(err, stdout, stderr) {

    t.ok(stdout.indexOf('"index":1') > -1, 'got value for key_1')
    t.end()
  })
})

test('put a value', function(t) {

  t.plan(1)
  var c = 'lev ' + fixtures_path + ' --put key_1 --value "x" -q'

  exec(c, function(err, stdout, stderr) {

    t.ok(stdout.indexOf('"OK"') > -1, 'put new value for key_1')
    t.end()
  })
})

test('put a value with specific encoding', function(t) {

  t.plan(1)
  var c = 'lev ' + fixtures_path + ' --put key_1 --valueEncoding "binary" --value "x" -q'

  exec(c, function(err, stdout, stderr) {

    t.ok(stdout.indexOf('"OK"') > -1, 'put new binary value for key_1')
    t.end()
  })
})

test('key count', function(t) {

  t.plan(1)
  var c = 'lev ' + fixtures_path + ' --keys -q | wc -w'

  exec(c, function(err, stdout, stderr) {

    t.ok(parseInt(stdout.trim(), 10) == 1024, 'correct number of keys')
    t.end()
  })
})

test('value count', function(t) {

  t.plan(1)
  var c = 'lev ' + fixtures_path + ' --values --valueEncoding "utf8" -q | wc -w'

  exec(c, function(err, stdout, stderr) {

    t.ok(parseInt(stdout.trim(), 10) == 1024, 'correct number of values')
    t.end()
  })
})

test('delete a key/value', function(t) {

  t.plan(1)
  var c = 'lev ' + fixtures_path + ' --del key_1 -q'

  exec(c, function(err, stdout, stderr) {

    t.ok(stdout.indexOf('"OK"') > -1, 'deleted key_1')
    t.end()
  })
})

test('limit results', function(t) {

  t.plan(1)
  var c = 'lev ' + fixtures_path + ' --keys --limit 10 -q | wc -w'

  exec(c, function(err, stdout, stderr) {

    t.ok(parseInt(stdout.trim(), 10) == 10, 'correct number of keys')
    t.end()
  })
})

// test('make a sublevel and put a key/value', function(t) {

//   t.plan(1)
//   var c = 'lev ' + fixtures_path + ' --keys --limit 10 -q | wc -w'

//   exec(c, function(err, stdout, stderr) {

//     t.ok(parseInt(stdout.trim(), 10) == 10, 'correct number of keys')
//     t.end()
//   })
// })


// test('change sublevel and get keys', function(t) {

//   t.plan(1)
//   var c = 'lev ' + fixtures_path + ' --keys --limit 10 -q | wc -w'

//   exec(c, function(err, stdout, stderr) {

//     t.ok(parseInt(stdout.trim(), 10) == 10, 'correct number of keys')
//     t.end()
//   })
// })

test('connect to networked database and get the last 10 keys', function(t) {

  t.plan(1)
  var server_port

  var server = net.createServer(function (con) {
    con.pipe(multilevel.server(db)).pipe(con)
    server_port = server.address().port
  })

  server.listen(0, function() {

    var c = 'lev --keys --reverse --limit 10 -q -a 127.0.0.1:' + server_port + ' -m ' + manifest_path

    exec(c, function(err, stdout, stderr) {

      t.ok(parseInt(stdout.trim(), 10) == 10, 'correct number of keys' + stderr)
      server.close()
      t.end()
    })
  })
})
