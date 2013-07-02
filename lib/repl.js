
var utils = require('./utils')
var es = require('event-stream')
var repl = require('repl')
var path = require('path')
var fs = require('fs')

var print = utils.print
var db
var REPL

var format = false
var cachedkeys = [] 
var subpath = ['/']

var replcfg = {
  prompt: '>',
  input: process.stdin,
  output: process.stdout,
  ignoreUndefined: true
}

function generateCache(callback) {

  cachedkeys = []

  db
    .createReadStream({ values: false })
    .on('data', function(data) {
      cachedkeys.push(data)
    })
    .on('end', callback)
}

function updatePath() {
  REPL.prompt = (subpath.join('/') || '/') + '>'
  REPL.displayPrompt()
}

function setupContextMethods() {

  REPL.context.cd = function(line) {

    if (line[0] === '..') {
      db = db._parent
      subpath.pop()
    }
    else if (line[0] === '/') {
      while (db._parent) {
        db = db._parent
        subpath.pop()
      }
    } else {
      REPL.context.sublevel(line[0])
    }
    updatePath()
  }

  REPL.context.keys = REPL.context.ls = function(opts) {

    if (typeof opts[0] === 'string') {
      opts = { start: opts[0], limit: (parseInt(opts[1]) || -1) }
    }
    else {
      opts = {}
    }

    opts.values = false

    var keys = []

    db.createReadStream(opts)
      .on('data', function(data) {
        if (cachedkeys.indexOf(data) < 0) {
          cachedkeys.push(data)
        }
        keys.push(data)
      })
      .on('end', function(data) {
        if (keys.length > 0) {
          utils.tabulate(process.stdout, keys)
        }
        else {
          print('0 keys')
        }
        REPL.displayPrompt()
      })
  }

  REPL.context.format = function(opts) {

    if (opts[1]) {

      if (opts[1] === 'depth') {
        opts[2] = parseInt(opts[2])
      }
      else if (opts[2] === 'true') {
        opts[2] = true
      } else if (opts[2] === 'false') {
        opts[2] = false
      }

      utils.format[opts[1]] = opts[2]
    }
    print(null, utils.format)
    REPL.displayPrompt()
  }

  REPL.context.pwd = function() {

    print(db.location)
    REPL.displayPrompt()
  }

  REPL.context.batch = function(array, callback) {

    if (typeof array[0] === string) {
      array = eval(array[0])
    }

    callback = callback || print

    db.batch(array, function() {
      generateCache(function() {
        callback.apply(this, arguments)
        REPL.displayPrompt()
      })
    })
  }

  REPL.context.get = function(key, callback) {

    callback = callback || print

    db.get(key, function() {
      callback.apply(this, arguments)
      REPL.displayPrompt()  
    })
  }

  REPL.context.put = function(key, value, callback) {
    callback = callback || print

    db.put(key, value, function() {
      generateCache(function() {
        callback.apply(this, arguments)
        REPL.displayPrompt()
      })
    })
  }

  REPL.context.del = function(key, callback) {

    callback = callback || print

    db.del(key, function(err) {
      generateCache(function() {
        callback(err)
        REPL.displayPrompt()
      })
    })
  }

  REPL.context.sublevel = function(p) {
    db = db.sublevel.apply(db, arguments)
    subpath.push(p)
    updatePath()
  }

  onLine = REPL.rli._onLine
  var special = ['ls', 'format', 'cd', 'pwd', 'get', 'put', 'del', 'batch']

  REPL.rli._onLine = function(data) {

    var line = data.trim().split(' ')

    if (special.indexOf(line[0]) > -1) {
      REPL.rli.emit('record', line.join(' '))
      var command = line.splice(0, 1)
      REPL.context[command](line)
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
  var cmdRE = /\b(?:get|del|delr|put|cd)\s*(.*)/

  function escapeRE(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
  }

  REPL.complete = function(line, callback) {

    var match = line.match(cmdRE) || (line.indexOf('keys(') > -1)
    var filter = []

    if (match) {

      if (cachedkeys.length === 0) {
        callback(null, [[], ''])
      } else {
        filter = cachedkeys.filter(function(e) {
          return e.match(new RegExp('^' + escapeRE(match[1]) + '(?:.*?)$'))
        })
      }

      var list = (filter.length > 0) ? filter : cachedkeys
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
