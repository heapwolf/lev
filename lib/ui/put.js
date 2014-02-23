var blessed = require('blessed')
var Output = require('./output')
var Keylist = require('./keylist')

function Put(screen, model, client) {

  var put = Put.put

  if (put) {
    put.detach()
    screen.append(put)
    return put
  }

  put = Put.put = blessed.box({
    parent: screen,
    hidden: true,
    keys: true,
    vi: true,
    align: 'center',
    mouse: true,
    tags: true,
    label: '{247-bg} {black-fg}PUT{/black-fg} {/247-bg}',
    width: 54,
    height: 19,
    left: 'center',
    top: 'center',
    hidden: true,
    padding: {
      top: 1,
      bottom: 1
    },
    style: {
      bg: 'white',
      fg: 'black',
      item: {
        hover: {
          bg: 239,
          fg: 'white'
        }
      }
    },
    border: {
      bg: 'white',
      fg: 247,
      type: 'ascii'
    }
  })

  put._.model = model

  blessed.element({
    parent: put,
    content: 'Key\n\n\n\n\n\nKey Encoding        Value Encoding\n\n\nValue',
    left: 1,
    style: {
      bg: 'white',
      fg: 'black',
    },
    top: 2,
    left: 2,
    right: 1,
    height: 14
  })

  put._.key = blessed.textarea({
    parent: put,
    scrollable: true,
    mouse: true,
    scrollbar: {
      ch: ' '
    },
    style: {
      bg: 243,
      fg: 'white',
      scrollbar: {
        inverse: true
      }
    },
    keys: true,
    vi: true,
    bg: 243,
    fg: 'white',
    hoverBg: 'black',
    height: 4,
    right: 2,
    left: 2,
    top: 3
  })

  put._.keyEncoding = blessed.textbox({
    parent: put,
    bg: 243,
    fg: 'white',
    hoverBg: 'black',
    height: 1,
    width: 10,
    left: 2,
    top: 9
  })

  put._.valueEncoding = blessed.textbox({
    parent: put,
    mouse: true,
    bg: 243,
    fg: 'white',
    hoverBg: 'black',
    scrollable: true,
    scrollbar: {
      ch: ' '
    },
    style: {
      bg: 243,
      fg: 'white',
      scrollbar: {
        inverse: true
      }
    },
    keys: true,
    vi: true,
    height: 1,
    width: 10,
    left: 22,
    top: 9
  })

  put._.keyEncoding.on('focus', function() {
    this.readInput()
  })

  put._.valueEncoding.on('focus', function() {
    this.readInput()
  })

  put._.value = blessed.textarea({
    parent: put,
    bg: 243,
    fg: 'white',
    scrollable: true,
    mouse: true,
    scrollbar: {
      ch: ' '
    },
    style: {
      bg: 243,
      fg: 'white',
      scrollbar: {
        inverse: true
      }
    },
    keys: true,
    vi: true,
    hoverBg: 'black',
    height: 4,
    right: 2,
    left: 2,
    top: 12,
    filled: 50
  })

  put._.key.on('click', function() {
    var opts = { value: put._.key.getValue() }
    screen.readEditor(opts, function(err, value) {
      if (err) return Output.log(err)

      put._.key.setValue(value)
      screen.render()
    })
  })

  put._.value.on('click', function() {
    var opts = { value: put._.value.getValue() }
    screen.readEditor(opts, function(err, value) {
      if (err) return Output.log(err)

      put._.value.setValue(value)
      screen.render()
    })
  })

  var buttonExec = blessed.button({
    parent: put,
    bottom: 1,
    height: 1,
    right: 2,
    width: 6,
    content: ' Exec ',
    align: 'center',
    style: {
      bg: 243,
      fg: 'white',
      focus: {
        bg: 'black'
      }
    },
    hoverBg: 'black',
    hoverFg: 'white',
    autoFocus: true,
    mouse: true
  })

  buttonExec.on('click', function() {
    var key = put._.key.getValue().trim()
    var value = put._.value.getValue().trim()
    client.put(key, value, function(err) {
      put.hide()
      screen.render()
    })
  })

  put.setFront()

  return put
}

Put.toggle = function() {

  var put = Put.put
  var model = put._.model
  var name = model.settings.connection
  var conn = model.settings.connections[name]

  if (!conn) {
    return Output.log('Not connected')
  }

  put._.keyEncoding.setValue(conn.keyEncoding || 'utf8')
  put._.valueEncoding.setValue(conn.valueEncoding || 'json')

  if (!put.visible) {
    put.show()
    Keylist.focus()
  }
  else {
    put.hide()
  }
  put.parent.render()
}

module.exports = Put
