
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
var tree
var REPL

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

function getSublevels() {
  
  var p = subpath.join('')
  var subtree = utils.walkObject(subpath, cachedtree)

  var sublevels = Object.keys(subtree).map(function(s) {
    return s + '/'
  })

  cachedkeys[p] = sublevels.concat(cachedkeys[p])
  return sublevels
} 

function generateCache(callback) {

  var p = subpath.join('')
  cachedkeys[p] = []
  tree.init(function(err, t) {
    if (err) {
      return callback(err)
    }
    cachedtree = t
    getSublevels()

    db
      .createReadStream({ /* start: current sublevel */ values: false })
      .on('data', function(data) {
        cachedkeys[p].push(data)
      })
      .on('end', callback)
  })
}

function updatePath() {

  REPL.prompt = (subpath.join('/') || '/') + '>'
  REPL.displayPrompt()
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

    if (!cachedkeys[subpath.join('')]) {
      cachedkeys[subpath.join('')] = []
      getSublevels()
    }

    updatePath()
  }

  REPL.context.ls = function(opts) {

    opts = opts || {}

    if (opts.rest) {
      opts = { start: opts.rest }
    }

    opts.values = false
    var p = subpath.join('')

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
    updatePath()
  }

  onLine = REPL.rli._onLine
  var specialMethods = ['ls', 'format', 'cd', 'pwd', 'get', 'del', 'tree']

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

      if (cachedkeys[subpath.join('')].length === 0) {
        callback(null, [[], ''])
      } else {
        filter = cachedkeys[subpath.join('')].filter(function(e) {
          return e.match(new RegExp('^' + escapeRE(match[1]) + '(?:.*?)$'))
        })
      }

      var list = (filter.length > 0) ? filter : cachedkeys[subpath.join('')]
      return callback(null, [list, match[1]])
    }
    compl.apply(this, arguments)
  }
}

module.exports = function(opts, _db, _tree) {

  db = _db
  tree = _tree

  generateCache(function() {

    REPL = repl.start(replcfg)

    setupHistory()
    setupContextMethods()
    setupCompletion()
  })
}
