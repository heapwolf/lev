var blessed = require('blessed')
var output = require('./output')
var keylist = require('./keylist')

function connections(screen, data) {
  
var width = 25

  connections.box = blessed.box({
    parent: screen,
    mouse: true,
    keys: true,
    label: ' Connections ',
    vi: true,
    align: 'left',
    border: {
      type: 'ascii'
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
    left: 'center',
    top: 'center',
    width: 'half',
    height: 'half',
    hidden: true,
    fg: 'blue'
  })

  connections.list = blessed.list({
    parent: connections.box,
    mouse: true,
    keys: true,
    vi: true,
    left: 1,
    top: 1,
    bottom: 1,
    width: width,
    align: 'left',
    tags: true,
    items: ['Default', 'Secondary'],
    scrollbar: {
      ch: ' '
    },
    style: {
      scrollbar: {
        inverse: true
      },
      fg: 'blue',
      selected: {
        bg: 'blue'
      },
      item: {
        hover: {
          bg: 'blue'
        }
      }
    }
  })

  connections.list.key('enter', function() {
    output.log('ok')
  })

  connections.list.key('escape', function() {
    connections.toggle(screen)
  })

  var sep = blessed.line({
    parent: connections.box,
    orientation: 'vertical',
    left: width,
    top: 1,
    bottom: 1
  })

  var cap_upper = blessed.element({
    parent: connections.box,
    content: '┬',
    left: width,
    top: 0,
    width: 1,
    height: 1
  })

  var cap_lower = blessed.element({
    parent: connections.box,
    content: '┴',
    left: width,
    bottom: 0,
    height: 1,
    width: 1
  })

  return connections.list
}

connections.toggle = function(screen) {
  connections.box.toggle()
  if (connections.box.visible) {
    connections.list.focus()
  }
  else {
    keylist.list.focus()
  }
  screen.render()
}

module.exports = connections
