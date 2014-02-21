var argv = require('optimist').argv
var util = require('util')
var path = require('path')
var fs = require('fs')
var archy = require('archy')

exports.tabulate = require('tabulate')

exports.filter = function filter(a, b) {
  
  return a.filter(function(n) {
    if(b.indexOf(n) === -1) { 
      return false 
    }
    return true
  })
}

exports.readConfig = function(model, logger) {

  try {

    model.settingsFile = find('.lev')
    model.settings = JSON.parse(fs.readFileSync(model.settingsFile)) || {}
    logger.log('reading user config from %s', model.settingsFile)
  }
  catch(ex) {

    if (ex.name === 'SyntaxError') {
      logger.log('error parsing settings file [%s]', ex.message)
    }
    logger.log(ex)
  }
}

exports.walkObject = function(a, o) {

  var r = o
  var tmp = a.slice(0)
  
  if (tmp[0] == '') {
    tmp.splice(0, 1)
  }
  if (tmp.length == 0) {
    return r
  }
  
  tmp.forEach(function(part) {
    if (r[part]) {
      r = r[part]
    }
    else {
      r = (r[part] = {})
    }
  })
  return r
}

exports.format = { colors: true, depth: 4, raw: false }

exports.print = function(err, val) {

  var msg = (err || val || 'OK')

  if (exports.format.raw === true) {
    return process.stdout.write(JSON.stringify(msg) + '\r\n')
  }

  console.log(util.inspect(msg , exports.format))
}

exports.archify = function(obj) {

  var tree = {}
  function walk(obj) {
    var nodes = []
    for (var key in obj) {
      if (typeof obj[key] == 'object') {
        nodes.push({ label: key, nodes: walk(obj[key]) })
      }
      else {
        nodes.push(key)
      }
    }
    return nodes
  }
  tree.nodes = walk(obj)
  return archy(tree)
}

exports.location = function() {

  var location = typeof argv.location === 'string'
  return location && argv.location || argv._[0] || process.cwd()
}

var find = exports.find = function () {

  var rel = path.join.apply(null, [].slice.call(arguments))
  function find(start, rel) {
    var file = path.join(start, rel)
   try {
      fs.statSync(file)
      return file
    } catch (err) {
      if(path.dirname(start) !== start) // root
        return find(path.dirname(start), rel)
    }
  }
  return find(process.cwd(), rel);
}

