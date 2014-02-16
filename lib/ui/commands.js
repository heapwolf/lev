
var blessed = require('blessed')
var connections = require('./connections')
var manifests = require('./manifests')
var output = require('./output')
var keylist = require('./keylist')
var client = require('../client')
var prompt = require('./prompt')

function commands(screen, query) {

  var conns = connections(screen)
  var mans = manifests(screen)

  var cmds = {}

  cmds['start'] = {
    prefix: '1',
    keys: ['1'],
    callback: function() {
      connections.box.hide()
      var p = prompt()
      p._.type('Start of range query:', query.start, function(err, value) {
        if (err) return callback(err);
        query.start = value
        client.query('Default', query, function() {
          keylist.list.focus()
        })
      })
    }
  }

  cmds['end'] = {
    prefix: '2',
    keys: ['2'],
    callback: function() {
      connections.box.hide()
      var p = prompt()
      p._.type('End of range query:', query.end, function(err, value) {
        if (err) return callback(err);
        query.end = value
        client.query('Default', query, function() {
          keylist.list.focus()
        })
      })
    }
  }

  cmds['direction'] = {
    prefix: '3',
    keys: ['3'],
    callback: function() {

    }
  }

  cmds['delete'] = {
    prefix: '4',
    keys: ['4'],
    callback: function() {}
  }

  cmds['put'] = {
    prefix: '5',
    keys: ['5'],
    callback: function() {}
  }

  cmds['connections'] = {
    prefix: '6',
    keys: ['6'],
    callback: function() {
      connections.toggle(screen)
    }
  }

  cmds['manifests'] = {
    prefix: '7',
    keys: ['7'],
    callback: function() {
      manifests.toggle(screen)
    }
  }

  return cmds
}

module.exports = commands
