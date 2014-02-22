
var fs = require('fs')
var repl = require('repl')
var path = require('path')
var deepmerge = require('deepmerge')
var delr = require('level-delete-range')
var Tree = require('level-subtree')
var utils = require('./utils')
var Client = require('./client')

var db
var tree
var model
var REPL
var print = utils.print
var format = false
var cachedkeys = {}
var cachedtree = {}
var subpath = ['']

var replcfg = {
  prompt: '/>',
  input: process.stdin,
  output: process.stdout,
  ignoreUndefined: true
}

function generateCache(callback) {

  var p = subpath.join('')
  cachedkeys[p] = []

  client.getSublevels(p, function(err, sublevels) {
    if (err) return cb(err)

    var subtree = utils.walkObject(subpath, sublevels)
    var keys = Object.keys(subtree).map(function(s) {
      return s + '/'
    })

    cachedkeys[p] = keys.concat(cachedkeys[p])

    var opts = model.query
    opts.values = false

    db
      .createReadStream(opts)
      .on('data', function(data) {
        cachedkeys[p].push(data)
      })
      .on('end', callback)
  })
}

function updatePath(subpath) {
  REPL.prompt = (subpath.join('/') || '/') + '>'
}

function setupHistory() {
  var f = path.join(utils.location(), '.lev_history')

  try {
    var history = fs.readFileSync(f, 'utf8')
    var historyLines = history.split('\n')

    historyLines.forEach(function(line) {
      if (line) {
        REPL.rli.history.unshift(line)
      }
    })

  } catch(ex) {}

  var s = fs.createWriteStream(f, { flags: 'a+' })

  function record(line) {
    s.write(line + '\n')
  }

  REPL.rli.on('line', record)
  REPL.rli.on('record', record)
}

function setupCompletion() {

  var compl = REPL.complete
  var cmdRE = /\b(?:get|del|cd|ls)\s+(.*)/
  var fnRE = /\b(?:get|del|delr|put)\(['|"](.*)/

  function escapeRE(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
  }

  REPL.complete = function(line, callback) {
    
    var match = line.match(cmdRE) || line.match(fnRE)
    var filter = []

    if (match) {

      if (cachedkeys[subpath.join('')].length === 0) {
        callback(null, [[], ''])
      } 
      else {
        filter = cachedkeys[subpath.join('')].filter(function(e) {
          return e.match(new RegExp('^' + escapeRE(match[1]) + '(?:.*?)$'))
        })
      }

      var list = (filter.length > 0) ? filter : cachedkeys[subpath.join('')]
      var partialRE = new RegExp('(' + escapeRE(match[1]) + ')(.*?)')

      if (filter.length > 0) {
        list.forEach(function(item, i) {
          list[i] = '\u001b[34m' + list[i].replace(partialRE, '$1\u001b[39m')
        })
      }

      return callback(null, [list, '\u001b[34m' + match[1] + '\u001b[39m'])
    }
    compl.apply(this, arguments)
  }
}

function setupContextMethods() {

  REPL.context.tree = function() {
    var subtree = utils.walkObject(subpath, cachedtree)
    console.log(utils.archify(subtree))
    REPL.displayPrompt()
  }

  REPL.context.cd = function(opts) {
    var sl = opts.rest || opts

    if (opts.rest.length === 0) {
      return REPL.displayPrompt()
    }

    sl = path.normalize(sl).split('/')

    if (sl === '/') {

      while (db._parent) {
        db = db._parent
        subpath.pop()
      }
    } 
    else if (sl.length) {
      for (var i = 0, l = sl.length; i < l; i++) {
        if (sl[i]) {
          if (sl[i] == '..') {
            if (db._parent) {
              db = db._parent
              subpath.pop()
            }
          }
          else {
            REPL.context.sublevel(sl[i])
          }
        }
      }
    } 
    else {
      REPL.context.sublevel(sl)
    }

    updatePath(subpath)

    if (!cachedkeys[subpath.join('')]) {
      cachedkeys[subpath.join('')] = []
      generateCache(function(err) {
        if (err) {
          return console.log(err)
        }
        REPL.displayPrompt()
      })
    }
  }

  REPL.context.start = function(opts) {
    model.query.start = opts.rest
    console.log('OK! SET START %s', model.query.start)
  }

  REPL.context.end = function(opts) {
    model.query.end = opts.rest
    console.log('OK! SET END %s', model.query.end)
  }

  REPL.context.limit = function(opts) {
    model.query.limit = Number(opts.rest || -1)
    console.log('OK! SET LIMIT %s', model.query.limit)
  }

  REPL.context.reverse = function(opts) {
    model.query.reverse = !model.query.reverse
    console.log('OK! SET REVERSE %s', model.query.reverse)
  }

  REPL.context.ls = function(opts) {

    opts = opts || {}

    if (opts.rest) {
      opts = { start: opts.rest }
    }

    opts.values = false
    var p = subpath.join('')

    generateCache(function() {

      db.createReadStream(opts)
        .on('data', function(data) {

          // TODO:
          // use cache for listing, invalidate, etc.
          //
          if (cachedkeys[p].indexOf(data) < 0) {
            cachedkeys[p].push(data)
          }
        })
        .on('end', function(data) {
          if (cachedkeys[p].length > 0) {
            utils.tabulate(process.stdout, cachedkeys[p])
          }
          else {
            print('no keys')
          }
          REPL.displayPrompt()
        })
    })
  }

  REPL.context.batch = function(opts, callback) {

    if (!opts) {
      return undefined
    }

    callback = callback || print

    db.batch(opts, function() {
      generateCache(function(err) {
        if (err) {
          return callback.apply(this, err)
        }
        callback.apply(this, arguments)
        REPL.displayPrompt()
      })
    })
  }

  REPL.context.get = function(opts, callback) {

    if (!opts) {
      return undefined
    }

    callback = callback || print
    key = opts.rest || opts

    db.get(key, function() {
      callback.apply(this, arguments)
      REPL.displayPrompt()
    })
  }

  REPL.context.put = function(key, val, callback) {

    if (!val || !key) {
      return 'key and value required'
    }

    callback = callback || print
    
    db.put(key, val, function() {
      cachedkeys[subpath.join('')].push(key)
      callback.apply(this, arguments)
      REPL.displayPrompt()
    })
  }

  REPL.context.del = function(opts, callback) {

    callback = callback || print
    var key = opts

    if (opts.rest) {
      key = opts.rest
    }

    db.del(key, function(err) {
      var keys = cachedkeys[subpath.join('')]
      keys.splice(keys.indexOf(key), 1)
      callback.apply(this, arguments)
      REPL.displayPrompt()
    })
  }

  REPL.context.delr = function(opts, callback) {

    if (!opts) {
      return undefined
    }

    callback = callback || print

    delr(db, opts, function(err) {
      generateCache(function() {
        callback.apply(this, arguments)
        REPL.displayPrompt()
      })
    })
  }

  REPL.context.sublevel = function(opts) {
    db = db.sublevel.apply(db, arguments)
    subpath.push(opts)
    updatePath(subpath)
  }

  onLine = REPL.rli._onLine
  var methods = Object.keys(REPL.context)

  REPL.rli._onLine = function(data) {

    var line = data.trim().split(' ')
    var method = line.splice(0, 1)[0]

    if (methods.indexOf(method) > -1) {

      REPL.rli.emit('record', data)
      REPL.context[method]({
        rest: line.join(' ')
      })
      return undefined
    }
    return onLine.apply(REPL.rli, arguments)
  }
}

module.exports = function(opts, _model) {

  opts.path = opts._[0]
  opts.local = true
  model = _model
  client = Client(model, console)

  if (!opts.valueEncoding) {
    opts.valueEncoding = 'json'
    console.log('Value encoding set to JSON')
  }

  if (!opts.keyEncoding) {
    console.log('Key encoding set to UTF8')
  }

  client.connect(opts, function(err, handle) {

    if (err) {
      if (err.message.indexOf('lock') > -1) {
        console.log('\nThe database is currently locked by another process, try connecting by remote.\n')
      }
      else {
        console.log(err.message)
      }
      process.exit(1)
    }

    tree = Tree(handle)
    db = handle

    generateCache(function(err) {

      REPL = repl.start(replcfg)

      var p = REPL.displayPrompt
      var bounce

      REPL.displayPrompt = function() {
        clearTimeout(bounce)
        bounce = setTimeout(function() {
          p.apply(REPL, arguments)
        }, 5)
      }

      setupHistory()
      setupContextMethods()
      setupCompletion()
    })
  })
}
