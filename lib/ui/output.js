var blessed = require('blessed')
var program = blessed.program()
var fmt = require('util').format
var buffer = ''
var util = require('util')
var vm = require('vm')
var context = {}

function Output(screen, model) {

  var output = Output.output

  if (output) {
    output.detach()
    screen.append(output)
    return output
  }

  output = Output.output = blessed.scrollabletext({
    parent: screen,
    keyable: true,
    mouse: true,
    vi: true,
    tags: true,
    scrollbar: {
      ch: ' '
    },
    style: {
      bg: 239,
      fg: 'gray',
      scrollbar: {
        inverse: true
      }
    },
    tags: true,
    height: '30%',
    bottom: 2,
    right: 0,
    padding: { top: 1 },
    left: 0
  })

  var textCmd = blessed.textbox({
    parent: screen,
    mouse: true,
    keys: true,
    bg: 239,
    fg: 'white',
    height: 1,
    right: 0,
    left: 0,
    bottom: 1
  })

  output.on('click', function() {
    screen.emit('keypress', ':')
  })

  var bounce
  textCmd.on('keypress', function(ch, key) {

    var val = textCmd.getValue()
    program.showCursor()

    if (val != '' && key.name == 'enter') {

      clearTimeout(bounce)
      bounce = setTimeout(function() {

        try {

          context.key = model.key
          context.value = model.value

          vm.runInThisContext(
            textCmd.getValue().slice(1), 
            vm.createContext(context)
          )

          Output.log(util.inspect(context))
        }
        catch(ex) {
          Output.log(ex)
        }
      }, 1)

      return false
    }
    if ((val.length == 1 && key.name == 'backspace') || key.name == 'enter') {
      textCmd.setValue(' ')
      program.hideCursor()
      screen.render()
    }
  })

  screen.on('keypress', function(ch, key) {

    if (ch == ':') {
      output.mode = 'command'
      textCmd.setValue(':')
      screen.render()
      program.showCursor()
      textCmd.focus()
      textCmd.readInput()
    }
    else if (ch == '/') {
      output.mode = 'search'
      textCmd.setValue('/')
      screen.render()
      program.showCursor()
      textCmd.readInput()
    }
  })  

  output.setBack()
  return output
}

Output.error = function() {
  Output.log.apply(null, arguments)
}

Output.log = function() {

  var output = Output.output

  if (buffer.length == 1e5) {
    buffer = buffer.substring(1e3, buffer.length)
  }

  buffer += fmt.apply(null, arguments) + '\r\n'
  output.setContent('{white-fg}' + buffer + '{/white-fg}')
  var max = output.getScrollHeight()
  output.scrollTo(max)
  output.parent.render()
}

module.exports = Output
