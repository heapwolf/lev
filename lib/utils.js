
var argv = require('optimist').argv
var util = require('util')
var path = require('path')
var fs = require('fs')

exports.tabulate = require('tabulate')

exports.filter = function filter(a, b) {
  return a.filter(function(n) {
    if(b.indexOf(n) === -1) { 
      return false 
    }
    return true
  })
}

exports.format = { colors: true, depth: 4, raw: false }

exports.print = function print(err, val) {

  if (exports.format.raw === true) {
    return process.stdout.write(JSON.stringify(err || val || 'OK') + '\r\n')
  }
  console.log(util.inspect(err || val || 'OK', exports.format))
}

exports.location = function() {
  return (typeof argv.location === 'string' && argv.location || argv._[0])
}

var find = exports.find = function () {
  //var rel = process.cwd() + [].slice.call(arguments)
  var rel = path.join.apply(null, [].slice.call(arguments))
  //console.log(__dirname + " __dirname");  
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
  //return find(process.cwd(), rel)
  return find(process.cwd(), rel);
}

