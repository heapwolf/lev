
var argv = require('optimist').argv
var util = require('util')

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
    return process.stdout.write(JSON.stringify(err || val) + '\r\n')
  }
  console.log(util.inspect(err || val || 'OK', exports.format))
}

exports.location = function() {
  return (typeof argv.location === 'string' && argv.location || argv._[0])
}
