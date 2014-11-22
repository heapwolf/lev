/*
 *
 * completion.js
 * all the magic needed for auto completion.
 *
 */
module.exports = function setupCompletion(repl, cache) {

  var compl = repl.complete
  var cmdRE = /\b(?:get|del|cd|ls)\s+(.*)/
  var fnRE = /\b(?:get|del|delr|put)\(['|"](.*)/

  function escapeRE(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
  }

  repl.complete = function(line, callback) {
    
    var match = line.match(cmdRE) || line.match(fnRE)
    var filter = []

    if (match) {

      if (cache.data.length === 0) {
        callback(null, [[], ''])
      }
      else {
        filter = cache.data.filter(function(e) {
          return e.match(new RegExp('^' + escapeRE(match[1]) + '(?:.*?)$'))
        })
      }

      var list = (filter.length > 0) ? filter : cache.data
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
};

