var Query = require('./query')
var Keylist = require('./keylist')
var Values = require('./values')
var Loading = require('./loading')
var Commands = require('./commands')
var Output = require('./output')
var Tree = require('./tree')
var Put = require('./put')
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
  var put = Put(screen, model, client)
  var connections = Connections(screen, model, client)

  Commands.add({
    name: 'QUERY',
    prefix: '1',
    keys: ['1'],
    callback: function() {

      connections.hide()
      tree.hide()
      info.hide()
      put.hide()

      query.toggle()
      screen.render()
    }
  })

  Commands.add({
    name: 'CREATE',
    prefix: '2',
    keys: ['2'],
    callback: function() {

      connections.hide()
      tree.hide()
      info.hide()
      query.hide()

      Put.toggle()
      screen.render()
    }
  })

  Commands.add({
    name: 'DELETE',
    prefix: '3',
    keys: ['3'],
    callback: function() {

      var selection = keylist.items[keylist.selected]

      if (!selection) return

      var key = selection.content

      if (!key || Keylist.isSublevel(key)) {
        return Output.log('NOT OK!', 'unable to delete a sublevel\n')
      }

      client.del(key, function(err) {
        if (err) return // error is logged by client

        //
        // TODO: prefer not to run the query again, need to fix blessed lists
        //
        client.query(function(err, keys) {
          if (err) return // error is logged by client

          screen.render()
          keylist.focus()
          Keylist.update(keys)
        })
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
      put.hide()

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
      put.hide()

      keylist.focus()
      Info.update(model, function(err) {
        if (err) {
          var msg = 'NOT OK! Please clarify ('
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
      put.hide()

      Connections.toggle()
      screen.render()
    }
  })

  screen.on('keypress', function(ch, key) {

    if (this.screen._.editing) return

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
      put.hide()

      keylist.focus()
      return screen.render()
    }
  })

  connections.focus()
  screen.render()
  return Output
}

module.exports = UI
