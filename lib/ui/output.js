var blessed = require('blessed')
var fmt = require('util').format
var buffer = ''

function output(screen) {

  output.screen = screen

  output.box = blessed.scrollabletext({
    parent: screen,
    mouse: true,
    vi: true,
    scrollbar: {
      ch: ' '
    },
    style: {
      scrollbar: {
        inverse: true
      }
    },
    tags: true,
    height: '30%',
    bottom: 0,
    right: 1,
    padding: { top: 1 },
    left: 1
  })

  var sep = blessed.line({
    parent: screen,
    orientation: 'horizontal',
    top: '70%',
    left: 0,
    right: 0
  })

  return output.box
}

output.error = function() {
  output.log.apply(null, arguments)
}

output.log = function() {

  buffer += fmt.apply(null, arguments) + '\r\n'
  output.box.setContent(buffer)
  var max = output.box.getScrollHeight()
  output.box.scrollTo(max)

  output.screen.render()
}

module.exports = output