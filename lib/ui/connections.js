var blessed = require('blessed')
var output = require('./output')
var keylist = require('./keylist')
var fs = require('fs')
var path = require('path')
var client = require('../client')
var program = blessed.program()

function saveSettings(model, cb) {
  fs.writeFile(model.settingsFile, JSON.stringify(model.settings), cb)
}

function Connections(screen, model) {

  var connections = Connections.connections
  var sidePanelWidth = 25

  if (connections) {
    connections.detach()
    screen.append(connections)
    return connections
  }

  connections = Connections.connections = blessed.box({
    parent: screen,
    mouse: true,
    keys: true,
    tags: true,
    label: '{black-fg}{white-bg}┤ {red-fg}Connections{/red-fg} ├{/black-fg}{/white-bg}',
    vi: true,
    align: 'left',
    border: {
      type: 'ascii',
      bg: 'white',
      fg: 'black'
    },
    style: {
      bg: 'white',
      fg: 'black',
      scrollbar: {
        inverse: true
      },
      selected: {
        bg: 'blue'
      },
      item: {
        hover: {
          bg: 'black'
        }
      }
    },
    left: 'center',
    top: '20%',
    width: '70%',
    height: 16,
    fg: 'blue'
  })

  connections.list = blessed.list({
    parent: connections,
    mouse: true,
    keys: true,
    vi: true,
    left: 1,
    top: 2,
    bottom: 3,
    width: sidePanelWidth,
    align: 'left',
    items: Object.keys(model.settings.connections),
    scrollbar: {
      ch: ' '
    },
    style: {
      bg: 'white',
      fg: 'black',
      scrollbar: {
        inverse: true
      },
      selected: {
        bg: 'black',
        fg: 'white'
      },
      item: {
        hover: {
          bg: 'black',
          fg: 'white'
        }
      }
    }
  })

  connections.list.on('focus', function() {
    connections.list.select(1)
  })

  var form = blessed.form({
    parent: connections,
    mouse: true,
    keys: true,
    vi: true,
    bg: 'white',
    fg: 'black',
    left: sidePanelWidth + 1,
    right: 1,
    top: 1,
    bottom: 4
  })

  var buttonConnect = blessed.button({
    parent: form,
    bottom: 0,
    height: 1,
    right: 1,
    width: 11,
    content: ' Connect ',
    align: 'center',
    style: {
      bg: 239,
      fg: 'white'
    },
    hoverBg: 'black',
    autoFocus: false,
    mouse: true,
  }) 

  var buttonSave = blessed.button({
    parent: form,
    bottom: 0,
    height: 1,
    right: 13,
    width: 8,
    content: ' Save ',
    align: 'center',
    style: {
      bg: 239,
      fg: 'white'
    },
    hoverBg: 'black',
    autoFocus: false,
    mouse: true,
  }) 

  var buttonDelete = blessed.button({
    parent: form,
    bottom: 0,
    height: 1,
    right: 22,
    width: 10,
    content: ' Delete ',
    align: 'center',
    style: {
      bg: 239,
      fg: 'white'
    },
    hoverBg: 'black',
    autoFocus: false,
    mouse: true,
  }) 

  var buttonCreate = blessed.button({
    parent: connections,
    bottom: 1,
    height: 1,
    right: 2,
    width: 10,
    content: ' Create ',
    align: 'center',
    style: {
      bg: 239,
      fg: 'white'
    },
    hoverBg: 'black',
    autoFocus: false,
    mouse: true,
  })

  var textName = blessed.textbox({
    parent: form,
    mouse: true,
    keys: true,
    bg: 239,
    fg: 'white',
    hoverBg: 'black',
    height: 1,
    right: 1,
    left: 17,
    top: 1,
    name: 'text'
  })

  var textPort = blessed.textbox({
    parent: form,
    mouse: true,
    keys: true,
    bg: 239,
    fg: 'white',
    hoverBg: 'black',
    height: 1,
    right: 1,
    left: 17,
    top: 3,
    name: 'text'
  })

  var textHost = blessed.textbox({
    parent: form,
    mouse: true,
    keys: true,
    bg: 239,
    fg: 'white',
    hoverBg: 'black',
    height: 1,
    right: 1,
    left: 17,
    top: 5,
    name: 'text'
  })

  var textManifest = blessed.textbox({
    parent: form,
    mouse: true,
    keys: true,
    bg: 239,
    fg: 'white',
    hoverBg: 'black',
    height: 1,
    right: 12,
    left: 17,
    top: 7,
    name: 'text'
  })

  textManifest.on('click', function() {
    textManifest.setValue('')
  })

  textPort.on('focus', function() {
    textPort.readInput()
  })

  textHost.on('focus', function() {
    textHost.readInput()
  })

  textName.on('focus', function() {
    textName.readInput()
  })

  buttonSave.on('click', function() {
    var name = textName.getValue()
    var port = textPort.getValue()
    var host = textHost.getValue()
    var manifest

    if (!model.settings.connections[name]) {
      connections.list.add(name)
    }
    
    try {
      manifest = textManifest.getValue()
    }
    catch (ex) {
      return output.log('NOT OK! could not parse manifest data')
    }

    if (!model.settings.connections[name]) {
      model.settings.connections[name] = {}
    }

    model.settings.connections[name].port = port
    model.settings.connections[name].host = host
    model.settings.connections[name].manifest = manifest

    saveSettings(model, function(err) {
      if (err) output.log('NOT OK!', err)
      output.log('OK! saved settings')
    })
  })

  buttonCreate.on('click', function() {
    var name = 'New Connection ' + connections.list.items.length
    var port = '1337'
    var host = '127.0.0.1'

    model.settings.connections[name] = {}
    model.settings.connections[name].port = port
    model.settings.connections[name].host = host
    model.settings.connections[name].manifest = ''

    textName.setValue(name)
    textPort.setValue(port)
    textHost.setValue(host)
    textManifest.setValue('')
    connections.list.add(name)
  })

  buttonDelete.on('click', function() {
    var name = textName.getValue()
    
    if (name == 'Default') return

    delete model.settings.connections[name]
    connections.list.removeItem(connections.list.selected)
    connections.list.select(0)
    screen.render()
    saveSettings(model, function(err) {
      if (err) output.log('NOT OK!', err)
      output.log('OK! saved settings')
    })
  })

  buttonConnect.on('click', function() {
    var name = textName.getValue()
    client.connect(model.settings.connections[name], function() {
      Connections.toggle(screen)

      client.query(model, function(err, keys) {
        if (err) output.log('NOT OK!', err)
        keylist.update(keys)
        screen.render()
      })
      
    })
  })

  var sep_h = blessed.line({
    parent: connections,
    orientation: 'horizontal',
    left: 0,
    style: {
      bg: 'white',
      fg: 'black',
    },
    bottom: 2,
    right: 0
  })

  var sep_v = blessed.line({
    parent: connections,
    orientation: 'vertical',
    style: {
      bg: 'white',
      fg: 'black',
    },
    left: sidePanelWidth,
    top: 1,
    bottom: 3
  })

  var formLabel = blessed.element({
    parent: form,
    content: 'Name\n\nPort\n\nHost\n\nManifest File',
    left: 1,
    style: {
      bg: 'white',
      fg: 'black',
    },
    top: 1,
    width: 15,
    height: 8
  })

  var cap_left = blessed.element({
    parent: connections,
    content: '├',
    left: 0,
    style: {
      bg: 'white',
      fg: 'black',
    },
    bottom: 2,
    width: 1,
    height: 1
  })

  var cap_right = blessed.element({
    parent: connections,
    content: '┤',
    right: 0,
    bottom: 2,
    style: {
      bg: 'white',
      fg: 'black',
    },
    width: 1,
    height: 1
  })

  var Locate = blessed.button({
    parent: form,
    top: 7,
    height: 1,
    right: 1,
    width: 10,
    content: ' Locate ',
    align: 'center',
    style: {
      bg: 'black',
      fg: 'white'
    },
    hoverBg: 'black',
    hoverFg: 'black',
    autoFocus: false,
    mouse: true,
  })
  .on('press', function() {
    connections.hide()
    fm.pick(process.cwd(), function(err, fname) {
      var EBADPATH = path.extname(fname) !== '.json'
      if (err || EBADPATH) {
        return output.error('NOT OK!', err || 'Not a .json file')
      }
      fs.readFile(fname, function(err, data) {
        if (err) return output.error('NOT OK!', err)
        try {
          JSON.parse(data.toString())
        }
        catch (ex) {
          return output.error('NOT OK!', ex)
        }
        textManifest.setValue(fname)
        connections.show()
        screen.render()
      })

    })
  })

  var fm = blessed.filemanager({
    parent: screen,
    label: ' Please select a {blue-fg}manifest.json{/blue-fg} ',
    border: {
      type: 'ascii'
    },
    scrollbar: {
      ch: ' '
    },
    style: {
      scrollbar: {
        inverse: true
      },
      selected: {
        bg: 'blue'
      },
      item: {
        hover: {
          bg: 'blue'
        }
      }
    },
    mouse: true,
    keys: true,
    vi: true,
    left: 'center',
    top: 'center',
    width: 'half',
    height: 'half',
    hidden: true
  })

  function select() {
    var keys = Object.keys(model.settings.connections)
    var key = keys[connections.list.selected]
    var conn = model.settings.connections[key]
    
    textName.setValue(key)
    textPort.setValue(conn.port)
    textHost.setValue(conn.host)
    textManifest.setValue(conn.manifest)
  }

  connections.list.on('select', select)
  connections.list.on('scroll', select)

  var cap_upper = blessed.element({
    parent: connections,
    content: '┬',
    style: {
      bg: 'white',
      fg: 'black',
    },
    left: sidePanelWidth,
    top: 0,
    width: 1,
    height: 1
  })

  var cap_lower = blessed.element({
    parent: connections,
    content: '┴',
    style: {
      bg: 'white',
      fg: 'black',
    },
    left: sidePanelWidth,
    bottom: 2,
    height: 1,
    width: 1
  })

  return connections
}

Connections.toggle = function(screen) {

  var connections = Connections.connections

  connections.toggle()
  if (connections.visible) {
    connections.list.focus()
  }
  else {
    keylist.list.focus()
  }
  screen.render()
}

module.exports = Connections
