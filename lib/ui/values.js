var blessed = require('blessed')
var Editor = require('./editor')
var output = require('./output')

function Values(screen, model, client) {

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
    tags: true,
    scrollbar: {
      ch: ' '
    },
    style: {
      bg: 243,
      fg: 'white',
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
      bg: 243,
      fg: 'black',
      type: 'ascii'
    },
    width: '50%',
    top: 0,
    height: '70%',
    right: 0
  })

  var editor = Editor(screen, values, function(content) {

    try {
      content = JSON.parse(content)
    }
    catch (ex) {
      return output.log('NOT OK!', ex.message)
    }

    client.put(model.key, content, function(err) {
      if (err) return // logged by client
    })
  })

  var activeTitle = '{white-bg}{black-fg} VALUE {/white-bg}{/black-fg}'
  var inactiveTitle = '{black-bg}{white-fg} VALUE {/black-bg}{/white-fg}'

  values.on('focus', function() {
    label.setContent(activeTitle)
    values.parent.render()
  })

  values.on('blur', function() {
    label.setContent(inactiveTitle)
    values.parent.render()
  })

  var label = blessed.element({
    parent: screen,
    content: inactiveTitle,
    left: '52%',
    tags: true,
    width: 7,
    height: 1
  })

  return values
}

Values.update = function(record) {
  var values = Values.values
  values.setContent(record.value)
}

module.exports = Values
