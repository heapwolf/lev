var argv = require('optimist').argv
var util = require('util')
var path = require('path')
var fs = require('fs')
var archy = require('archy')
var defaults = require('../defaults.json')
var configFile = process.env['HOME'] + '/.lev'

exports.tabulate = require('tabulate')

exports.readConfig = function () {

  var config

  try {
    config = JSON.parse(fs.readFileSync(configFile)) || {}
  }
  catch (ex) {
    fs.writeFileSync(configFile, JSON.stringify(defaults))
    return defaults
  }
  return config
}

exports.writeConfig = function (config) {
  try {
    fs.writeFileSync(configFile, JSON.stringify(config))
  }
  catch(ex) {
    console.log('error writing config file to %s', configFile)
    process.exit(1)
  }
}

exports.walkObject = function (a, o) {

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

exports.print = function (err, val) {

  var msg = (err && err.message || val || 'OK')

  if (exports.format.raw === true) {
    return process.stdout.write(JSON.stringify(msg) + '\r\n')
  }

  console.log(util.inspect(msg, exports.format))
}

exports.archify = function (obj) {

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

exports.location = function () {

  var location = typeof argv.location === 'string'
  return location && argv.location || argv._[0] || process.cwd()
}
