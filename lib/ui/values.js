var blessed = require('blessed')
var output = require('./output')

function Values(screen, list) {

  var values = Values.values

  if (values) {
    values.detach()
    screen.append(values)
    return values
  }

  values = Values.values = blessed.scrollabletext({
    parent: screen,
    name: 'values',
    keyable: true,
    mouse: true,
    keys: true,
    tags: true,
    vi: true,
    scrollable: true,
    tags: true,
    scrollbar: {
      ch: ' '
    },
    style: {
      bg: 'blue',
      fg: 'black',
      scrollbar: {
        inverse: true
      },
      focus: {
        border: {
          fg: 'white'
        }
      }
    },
    border: {
      bg: 'blue',
      fg: 239,
      type: 'ascii'
    },
    padding: {
      top: 1,
      bottom: 1,
      left: 1,
      right: 1
    },
    width: '50%',
    top: 0,
    height: '70%',
    right: 0
  })

  return values
}

Values.update = function(record) {
  var values = Values.values
  values.setContent(record.value)
}

module.exports = Values
