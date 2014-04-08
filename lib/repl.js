
var fs = require('fs')
var repl = require('repl')
var path = require('path')
var deepex = require('deep-extend')
var delr = require('level-delete-range')
var Tree = require('level-subtree')
var utils = require('./utils')
var Client = require('./client')
var Tabulate = require('tabulate')

var db
var tree
var config
var REPL
var print = utils.print
var cachedkeys = {}
var cachedtree = {}
var subpath = ['']
var tabulate = Tabulate(process.stdout)

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

    var opts = config.query
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
    else {
      REPL.displayPrompt()
    }
  }

  REPL.context.start = function(opts) {
    config.query.start = opts.rest
    console.log('OK! SET START %s', config.query.start)
    REPL.displayPrompt()
  }

  REPL.context.end = function(opts) {
    config.query.end = opts.rest
    console.log('OK! SET END %s', config.query.end)
    REPL.displayPrompt()
  }

  REPL.context.limit = function(opts) {
    config.query.limit = Number(opts.rest || -1)
    console.log('OK! SET LIMIT %s', config.query.limit)
    REPL.displayPrompt()
  }

  REPL.context.reverse = function(opts) {
    config.query.reverse = !config.query.reverse
    console.log('OK! SET REVERSE %s', config.query.reverse)
    REPL.displayPrompt()
  }

  REPL.context.ls = function(opts) {

    var opts = {}
    deepex(opts, config.query)

    opts.values = false
    var p = subpath.join('')

    cachedkeys[p].length = 0

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

        generateCache(function(err) {
          if (cachedkeys[p].length > 0) {
            process.stdout.write(tabulate.write(cachedkeys[p]))
          }
          else {
            print(null, 'no keys')
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

  REPL.context.rm = 
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
    try {
      db = db.sublevel.apply(db, arguments)
      subpath.push(opts)
      updatePath(subpath)
    }
    catch(ex) {
      console.log(ex.message)
    }
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

module.exports = function(opts, cfg) {

  opts.path = opts._[0]

  if (!opts.manifest && !opts.port) {
    opts.local = true
  }

  config = cfg
  client = Client(config, console)

  client.connect(opts, function(err, handle, tree) {

    if (err) {
      if (err.message.indexOf('lock') > -1) {
        console.log('The database is currently locked by another process.\n')
      }
      else {
        console.log(err.message)
      }
      process.exit(1)
    }

    if (!opts.manifest) tree = Tree(handle)

    db = handle

    generateCache(function(err) {

      REPL = repl.start(replcfg)

      // var p = REPL.displayPrompt
      // var bounce

      // REPL.displayPrompt = function() {
      //   var args = arguments
      //   console.log('x')
      //   clearTimeout(bounce)
      //   bounce = setTimeout(function() {
      //     p.apply(REPL, args)
      //   }, 5)
      // }

      setupHistory()
      setupContextMethods()
      setupCompletion()
    })
  })
}
