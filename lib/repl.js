
var utils = require('./utils')
var print = utils.print
var es = require('event-stream')
var repl = require('repl')
var path = require('path')
var delr = require('level-delete-range')
var deepmerge = require('deepmerge')
var fs = require('fs')

var errors = require('level/node_modules/levelup/lib/errors')

errors.NotFoundError = function() {
  var key = arguments[0].match(/\[(.*?)\]/)
  return print(null, 'No such key at this sublevel')
}

var db
var REPL

var format = false
var cachedkeys = {}
var currentSublevel = ''
var subpath = ['']

var replcfg = {
  prompt: '/>',
  input: process.stdin,
  output: process.stdout,
  ignoreUndefined: true
}

function generateCache(callback) {

  cachedkeys[currentSublevel] = []

  db
    .createReadStream({ values: false })
    .on('data', function(data) {
      cachedkeys[currentSublevel].push(data)
    })
    .on('end', callback)
}

function updatePath() {
  REPL.prompt = (subpath.join('/') || '/') + '>'
  REPL.displayPrompt()
}

function setupContextMethods() {

  REPL.context.cd = function(opts) {

    if (!opts || opts && opts.rest && opts.rest.length === 0) {
      return REPL.displayPrompt()
    }

    var sl = opts.rest || opts

    if (sl === '..') {

      db = db._parent
      subpath.pop()

    } else if (sl === '/') {

      while (db._parent) {
        db = db._parent
        subpath.pop()
      }
    
    } else if (sl.lastIndexOf('/') > 0) {

      sl = sl.split('/')
      for (var i = 0, l = sl.length; i < l; i++) {
        REPL.context.sublevel(sl[i])
      }

    } else {
      REPL.context.sublevel(sl)
    }

    currentSublevel = db._prefix || ''

    if (!cachedkeys[currentSublevel]) {
      cachedkeys[currentSublevel] = []
    }

    updatePath()
  }

  REPL.context.ls = function(opts) {

    opts = opts || {}

    if (opts.rest) {
      opts = { start: opts.rest }
    }

    opts.values = false

    var keys = []

    db.createReadStream(opts)
      .on('data', function(data) {
        if (cachedkeys[currentSublevel].indexOf(data) < 0) {
          cachedkeys[currentSublevel].push(data)
        }
        keys.push(data)
      })
      .on('end', function(data) {
        if (keys.length > 0) {
          utils.tabulate(process.stdout, keys)
        }
        else {
          print('no keys')
        }
        REPL.displayPrompt()
      })
  }

  REPL.context.format = function(opts) {

    if (opts.rest) {

      if (opts.rest.length > 0) {

        opts = opts.rest[0].split(' ')

        if (opts[0] === 'depth') {
          opts[1] = parseInt(opts[1])
        }
        else if (opts[1] === 'true') {
          opts[1] = true
        } else if (opts[1] === 'false') {
          opts[1] = false
        }

        utils.format[opts[0]] = opts[1]
      }
    }
    else {
      utils.format = deepmerge(utils.format, opts)
    }

    print(null, utils.format)
    REPL.displayPrompt()
  }

  REPL.context.pwd = function() {

    print(db.location)
    REPL.displayPrompt()
  }

  REPL.context.batch = function(opts, callback) {

    if (!opts) {
      return undefined
    }

    callback = callback || print

    db.batch(opts, function() {
      generateCache(function() {
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

  REPL.context.put = function(opts, callback) {
    
    if(!opts){
      return undefined
    }
    var optArr = opts.rest.split(' ')
    var key = optArr.shift();
    var val = optArr.join(' ')

    if (!val || !key) {
      return 'key and value required'
    }

    callback = callback || print
    db.put(key, val, function() {
      generateCache(function() {
        callback.apply(this, arguments)
        REPL.displayPrompt()
      })
    })
  }

  REPL.context.del = function(opts, callback) {

    callback = callback || print
    var key = opts

    if (opts.rest) {
      key = opts.rest
    }

    db.del(key, function(err) {
      generateCache(function() {
        callback.apply(this, arguments)
        REPL.displayPrompt()
      })
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
    updatePath()
  }

  onLine = REPL.rli._onLine
  var specialMethods = ['ls', 'format', 'cd', 'pwd', 'get', 'del', "put"]

  REPL.rli._onLine = function(data) {

    var line = data.trim().split(' ')
    var method = line.splice(0, 1)[0]

    if (specialMethods.indexOf(method) > -1) {
      REPL.rli.emit('record', data)
      REPL.context[method]({
        rest: line.join(' ')
      })
      return undefined
    }
    return onLine.apply(REPL.rli, arguments)
  }
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
  var cmdRE = /\b(?:get|del|delr|put|cd|ls)\s*(.*)/

  function escapeRE(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
  }

  REPL.complete = function(line, callback) {

    var match = line.match(cmdRE) || (line.indexOf('keys(') > -1)
    var filter = []

    if (match) {

      if (cachedkeys[currentSublevel].length === 0) {
        callback(null, [[], ''])
      } else {
        filter = cachedkeys[currentSublevel].filter(function(e) {
          return e.match(new RegExp('^' + escapeRE(match[1]) + '(?:.*?)$'))
        })
      }

      var list = (filter.length > 0) ? filter : cachedkeys[currentSublevel]
      return callback(null, [list, match[1]])
    }
    compl.apply(this, arguments)
  }
}

module.exports = function(opts, _db) {

  db = _db

  generateCache(function() {

    REPL = repl.start(replcfg)

    setupHistory()
    setupContextMethods()
    setupCompletion()
  })
}
