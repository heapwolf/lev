var blessed = require('blessed')
var Output = require('./output')
var keylist = require('./keylist')
var commands = require('./commands')
var fs = require('fs')
var path = require('path')
var program = blessed.program()
var list

function saveSettings(model, cb) {
  fs.writeFile(model.settingsFile, JSON.stringify(model.settings), cb)
}

function Connections(screen, model, client) {

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
    label: '{247-bg} {black-fg}CONNECTIONS{/black-fg} {/247-bg}',
    vi: true,
    align: 'left',
    border: {
      type: 'ascii',
      bg: 'white',
      fg: 247
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
    top: '15%',
    width: '70%',
    height: 21
  })

  // screen.on('keypress', function(ch, key) {
  //   if (connections.visible && key.name == 'escape') {
  //     connections.hide()
  //     screen.render()
  //   }
  // })

  var form = blessed.form({
    parent: connections,
    mouse: true,
    keys: true,
    vi: true,
    bg: 'white',
    fg: 'black',
    left: 1,
    right: 1,
    top: 1,
    bottom: 3
  })

  var list = connections._.list = blessed.list({
    parent: form,
    mouse: true,
    keys: true,
    vi: true,
    left: 0,
    top: 1,
    bottom: 1,
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
        bg: 243,
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

  list.on('select', function() {
    var keys = Object.keys(model.settings.connections)
    var key = keys[list.selected]
    var conn = model.settings.connections[key]

    toggleType(conn.local)

    textName.setValue(key)
    textPath.setValue(conn.path)
    textPort.setValue(conn.port)
    textHost.setValue(conn.host)
    textManifest.setValue(conn.manifest)
    screen.render()
  })

  //
  // TODO: add 'postrender' event
  //
  process.nextTick(function() {
    list.focus()
    list.emit('select')
    screen.render()
  })

  // list.on('focus', function() {
  //   list.select(1)
  // })

  var labelWidth = 15
  var formLabelRemote = blessed.element({
    parent: form,
    content: ['Name\n\nType\n\nKey Encoding                Value Encoding',
              '\n\n\n\nPort\n\nHost\n\nManifest File'].join(''),
    left: 1,
    style: {
      bg: 'white',
      fg: 'black',
    },
    top: 1,
    left: sidePanelWidth + 1,
    right: 1,
    height: 14
  })

  var formLabelLocal = blessed.element({
    parent: form,
    content: ['Name\n\nType\n\nKey Encoding                Value Encoding',
              '\n\n\n\nPath\n\nCache Size\n\nCompression'].join(''),
    left: 1,
    style: {
      bg: 'white',
      fg: 'black',
    },
    top: 1,
    left: sidePanelWidth + 1,
    right: 1,
    hidden: true,
    height: 14
  })

  var textName = blessed.textbox({
    parent: form,
    mouse: true,
    keys: true,
    bg: 243,
    fg: 'white',
    hoverBg: 'black',
    height: 1,
    left: sidePanelWidth + labelWidth + 1,
    right: 1,
    top: 1
  })

  var checkType = blessed.checkbox({
    parent: form,
    mouse: true,
    keys: true,
    shrink: true,
    style: {
      bg: 'white',
      fg: 'black'
    },
    height: 1,
    left: sidePanelWidth + labelWidth + 1,
    top: 3,
    name: 'check',
    content: 'Local Database'
  })

  var textKeyEncoding = blessed.textbox({
    parent: form,
    mouse: true,
    keys: true,
    bg: 243,
    fg: 'white',
    hoverBg: 'black',
    height: 1,
    left: sidePanelWidth + labelWidth + 1,
    width: 10,
    top: 5,
    value: 'utf8'
  })

  var textValueEncoding = blessed.textbox({
    parent: form,
    mouse: true,
    keys: true,
    bg: 243,
    fg: 'white',
    hoverBg: 'black',
    height: 1,
    left: sidePanelWidth + labelWidth + 30,
    width: 10,
    top: 5,
    value: 'json'
  })

  function toggleType(local) {
    if (local) {
      textPath.show()
      buttonClearLocal.show()
      textCacheSize.show()
      formLabelLocal.show()

      formLabelRemote.hide()
      textPort.hide()
      textHost.hide()
      buttonClearManifest.hide()
      textManifest.hide()
      checkType.check()
    }
    else {
      textPath.hide()
      buttonClearLocal.hide()
      textCacheSize.hide()
      formLabelLocal.hide()

      formLabelRemote.show()
      textPort.show()
      textHost.show()
      buttonClearManifest.show()
      textManifest.show()
      checkType.uncheck()
    }
    screen.render()
  }

  checkType.on('click', function() {
    toggleType(checkType.checked)
  })

  var textPath = blessed.textbox({
    parent: form,
    mouse: true,
    keys: true,
    bg: 243,
    fg: 'white',
    hoverBg: 'black',
    height: 1,
    left: sidePanelWidth + labelWidth + 1,
    right: 11,
    top: 9,
    hidden: true,
    name: 'text'
  })

  var buttonClearLocal = blessed.button({
    parent: form,
    top: 9,
    height: 1,
    right: 1,
    width: 9,
    content: ' Clear ',
    align: 'center',
    style: {
      bg: 243,
      fg: 'white',
      focus: {
        bg: 'black'
      }
    },
    hoverBg: 'black',
    hoverFg: 'black',
    hidden: true,
    mouse: true,
  })

  buttonClearLocal.on('click', function() {
    textPath.clearValue()
    screen.render()
  })

  var textCacheSize = blessed.textbox({
    parent: form,
    mouse: true,
    keys: true,
    bg: 243,
    fg: 'white',
    hoverBg: 'black',
    height: 1,
    left: sidePanelWidth + labelWidth + 1,
    width: 25,
    top: 11,
    hidden: true,
    value: '8388608'
  })

  var checkCompression = blessed.checkbox({
    parent: form,
    mouse: true,
    keys: true,
    shrink: true,
    style: {
      bg: 'white',
      fg: 'black'
    },
    height: 1,
    left: sidePanelWidth + labelWidth + 1,
    top: 13,
    checked: true,
    content: 'Use Snappy'
  })


  var sep = blessed.line({
    parent: connections,
    orientation: 'horizontal',
    left: sidePanelWidth + 2,
    right: 2,
    top: 8,
    style: {
      bg: 'white',
      fg: 247,
    }
  })

  var textPort = blessed.textbox({
    parent: form,
    mouse: true,
    keys: true,
    bg: 243,
    fg: 'white',
    hoverBg: 'black',
    height: 1,
    left: sidePanelWidth + labelWidth + 1,
    right: 1,
    top: 9,
    name: 'text'
  })

  var textHost = blessed.textbox({
    parent: form,
    mouse: true,
    keys: true,
    bg: 243,
    fg: 'white',
    hoverBg: 'black',
    height: 1,
    left: sidePanelWidth + labelWidth + 1,
    right: 1,
    top: 11,
    name: 'text'
  })

  var textManifest = blessed.textbox({
    parent: form,
    mouse: true,
    keys: false,
    bg: 243,
    fg: 'white',
    hoverBg: 'black',
    height: 1,
    right: 11,
    left: sidePanelWidth + labelWidth + 1,
    top: 13,
    name: 'text'
  })

  var buttonClearManifest = blessed.button({
    parent: form,
    top: 13,
    height: 1,
    right: 1,
    width: 9,
    content: ' Clear ',
    align: 'center',
    style: {
      bg: 243,
      fg: 'white',
      focus: {
        bg: 'black'
      }
    },
    hoverBg: 'black',
    hoverFg: 'black',
    mouse: true,
  })

  buttonClearManifest.on('click', function() {
    textManifest.clearValue()
    screen.render()
  })

  function locate() {
    
    connections.hide()
    
    fm.pick(process.cwd(), function(err, fname) {

      if (!fname) {
        connections.show()
        screen.render()
        return fm.hide()
      }

      if (checkType.checked) {
        
        textPath.setValue((path.dirname(fname)))
        connections.show()
        fm.hide()
        textPath.emit('blur')
        screen.render()
        return
      }

      fs.readFile(fname, function(err, data) {
        
        if (err) return output.error('NOT OK!', err)
        textManifest.setValue(fname)
        connections.show()
        screen.render()
      })
    })
  }

  textManifest.on('click', locate)
  textPath.on('click', locate)

  var buttonDelete = blessed.button({
    parent: form,
    bottom: 0,
    height: 1,
    right: 10,
    width: 10,
    content: ' Delete ',
    align: 'center',
    style: {
      bg: 243,
      fg: 'white',
      focus: {
        bg: 'black'
      }
    },
    hoverBg: 'black',
    autoFocus: false,
    mouse: true,
  }) 

  var buttonSave = blessed.button({
    parent: form,
    bottom: 0,
    height: 1,
    right: 1,
    width: 8,
    content: ' Save ',
    align: 'center',
    style: {
      bg: 243,
      fg: 'white',
      focus: {
        bg: 'black'
      }
    },
    hoverBg: 'black',
    autoFocus: false,
    mouse: true,
  }) 

  var buttonCreate = blessed.button({
    parent: connections,
    bottom: 1,
    height: 1,
    right: 14,
    width: 10,
    content: ' Create ',
    align: 'center',
    style: {
      bg: 243,
      fg: 'white',
      focus: {
        bg: 'black'
      } 
    },
    hoverBg: 'black',
    autoFocus: false,
    mouse: true,
  })

  var buttonConnect = blessed.button({
    parent: connections,
    bottom: 1,
    height: 1,
    right: 2,
    width: 11,
    content: ' Connect ',
    align: 'center',
    style: {
      bg: 243,
      fg: 'white',
      focus: {
        bg: 'black'
      }
    },
    hoverBg: 'black',
    autoFocus: false,
    mouse: true,
  })

  textPort.on('focus', function() {
    this.readInput()
  })

  textHost.on('focus', function() {
    this.readInput()
  })

  textName.on('focus', function() {
    this.readInput()
  })

  textKeyEncoding.on('focus', function() {
    this.readInput()
  })

  textValueEncoding.on('focus', function() {
    this.readInput()
  })

  buttonSave.on('click', function() {
    var name = textName.getValue()
    var port = textPort.getValue()
    var host = textHost.getValue()
    var fpath = textPath.getValue()
    var keyEncoding = textKeyEncoding.getValue()
    var valueEncoding = textValueEncoding.getValue()
    var manifest = textManifest.getValue()
    var cacheSize = parseInt(textCacheSize.getValue())

    if (!model.settings.connections[name]) {
      list.add(name)
    }

    if (!model.settings.connections[name]) {
      model.settings.connections[name] = {}
    }

    var o = {}

    o.path = fpath
    o.keyEncoding = keyEncoding
    o.valueEncoding = valueEncoding
    o.local = checkType.checked
    o.compression = checkCompression.checked
    o.cacheSize = cacheSize
    o.port = port
    o.host = host
    o.manifest = manifest

    model.settings.connections[name] = o

    saveSettings(model, function(err) {
      if (err) Output.log('NOT OK!', err)
      Output.log('OK! saved settings')
    })
  })

  buttonCreate.on('click', function() {

    var name = 'New Connection ' + list.items.length
    var port = '1337'
    var host = '127.0.0.1'
    var o = {}

    o.port = port
    o.host = host
    o.manifest = ''
    o.keyEncoding = 'utf8'
    o.valueEncoding = 'json'

    model.settings.connections[name] = o

    textName.setValue(name)
    textPort.setValue(port)
    textHost.setValue(host)
    textManifest.setValue('')
    textKeyEncoding.setValue('utf8')
    textValueEncoding.setValue('utf8')

    list.add(name)
    list.scrollTo(list.items.length)
    list.select(list.items.length)
    screen.render()
  })

  buttonDelete.on('click', function() {
    
    //
    // this whole stinky code is because lists don't
    // update properly. make a pull request to fix.
    //
    var list = list
    var index = list.selected
    var item = list.items[index]

    if (!item || item.content == 'Default') return
    if (!model.settings.connections[item.content]) return

    delete model.settings.connections[item.content]

    var l = list.items.length

    if (l > 0) {
      while(l--) {
        list.removeItem(l)
      }
    }

    list.setItems(Object.keys(model.settings.connections))

    screen.render()

    saveSettings(model, function(err) {
      if (err) Output.log('NOT OK!', err)
      Output.log('OK! saved settings')
    })
  })

  buttonConnect.on('click', function() {
    var name = textName.getValue()
    client.connect(model.settings.connections[name], function(err) {

      if (err) {
        Output.log('the database is locked by another process')
        return
      }

      Connections.toggle()

      client.query(function(err, keys) {
        if (err) Output.log('NOT OK!', err)
        keylist.update(keys)
        commands.update('{yellow-fg}⚡{/yellow-fg} ' + name + ' ')
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
      fg: 247,
    },
    bottom: 2,
    right: 0
  })

  var sep_v = blessed.line({
    parent: connections,
    orientation: 'vertical',
    style: {
      bg: 'white',
      fg: 247,
    },
    left: sidePanelWidth,
    top: 1,
    bottom: 3
  })

  var cap_left = blessed.element({
    parent: connections,
    content: '├',
    left: 0,
    style: {
      bg: 'white',
      fg: 247,
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
      fg: 247,
    },
    width: 1,
    height: 1
  })

  var fm = blessed.filemanager({
    parent: screen,
    label: ' Select a file ',
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

  // fm.on('keypress', function(ch, key) {
  //   if (key.name == 'escape') {
  //     fm.hide()
  //     connections.show()
  //     screen.render()
  //   }
  // })

  var cap_upper = blessed.element({
    parent: connections,
    content: '┬',
    style: {
      bg: 'white',
      fg: 247,
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
      fg: 247,
    },
    left: sidePanelWidth,
    bottom: 2,
    height: 1,
    width: 1
  })

  return connections
}

Connections.toggle = function() {

  var connections = Connections.connections

  connections.toggle()

  if (connections.visible) {
    connections.list.focus()
  }
  else {
    keylist.list.focus()
  }
  connections.parent.render()
}

module.exports = Connections
