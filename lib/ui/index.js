var Query = require('./query')
var Keylist = require('./keylist')
var Values = require('./values')
var Loading = require('./loading')
var Commands = require('./commands')
var Output = require('./output')
var Tree = require('./tree')
var Info = require('./info')
var Connections = require('./connections')
var Screen = require('./screen')
var utils = require('../utils')
var Client = require('../client')

function UI(model) {

  var screen = Screen()

  //
  // this is the console at the bottom of the screen
  //
  var output = Output(screen, model)
  
  //
  // the client that handles all the calls to the database
  // pass it output so that it can log stuff.
  //
  var client = Client(model, Output)

  //
  // try to read the user's config
  //
  utils.readConfig(model, Output)
  //console.log(model.settings)

  //
  // this is the rest of the user interface
  //
  var keylist = Keylist(screen, model, client)
  var values = Values(screen, model, client)
  var loading = Loading(screen, model, client)
  var commands = Commands(screen, model, client)
  var query = Query(screen, model, client)
  var tree = Tree(screen, model, client)
  var info = Info(screen, model, client)
  var connections = Connections(screen, model, client)

  Commands.add({
    name: 'QUERY',
    prefix: '1',
    keys: ['1'],
    callback: function() {
      connections.hide()
      tree.hide()
      info.hide()
      query.toggle()
      screen.render()
    }
  })

  Commands.add({
    name: 'DELETE',
    prefix: '2',
    keys: ['2'],
    callback: function() {

      var selection = keylist.items[keylist.selected]

      if (!selection) return

      var key = selection.content

      if (!key || Keylist.isSublevel(key)) {
        return Output.log('NOT OK!', 'unable to delete that key\n')
      }

      client.del(key, function(err) {
        if (err) return Output.log('NOT OK!', err)
        keylist.removeItem(key)
        screen.render()
      })
    }
  })

  Commands.add({
    name: 'EDIT',
    prefix: '3',
    keys: ['3'],
    callback: function() {
      var opts = { value: values.getText() }
      screen.readEditor(opts, function(err, value) {
        if (err) return Output.log(err)
        if (opts.value === value) return

        //
        // TODO: if encoding is JSON, try to json parse.
        //

        var key = keylist.items[keylist.selected].content
        client.put(key, value.trim())
        values.setContent(value)
        screen.render()
      })
    }
  })

  Commands.add({
    name: 'TREE',
    prefix: '4',
    keys: ['4'],
    callback: function() {
      connections.hide()
      query.hide()
      info.hide()
      Tree.update()
      tree.toggle()
      screen.render()
    }
  })

  Commands.add({
    name: 'INFO',
    prefix: '5',
    keys: ['5'],
    callback: function() {
      connections.hide()
      query.hide()
      tree.hide()
      Info.update(model, function(err) {
        if (err) {
          var msg = 'NOT OK! Possibly huge query ('
          return Output.log(msg + err.message + ')')
        }
        info.toggle()
        screen.render()
      })
    }
  })

  Commands.add({
    name: 'CONNECTIONS',
    prefix: '6',
    keys: ['6'],
    callback: function() {
      query.hide()
      tree.hide()
      info.hide()
      connections.toggle()
      screen.render()
    }
  })

  screen.on('keypress', function(ch, key) {
    if (key && key.name == 'tab') {
      if (!key.shift) {
        screen.focusNext()
      } else {
        screen.focusPrev()
      }
      return screen.render()
    }
    else if (key && key.name == 'escape') {
      connections.hide()
      query.hide()
      tree.hide()
      info.hide()
      return screen.render()
    }
  })

  connections.focus()
  screen.render()
  return Output
}

module.exports = UI
