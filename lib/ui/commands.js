var blessed = require('blessed')

var drawn = 0

function commands(screen) {

  var width = 60
  var drawn = 0

  commands.screen = screen
  commands.bar = blessed.box({
    parent: screen,
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    align: 'right',
    style: {
      fg: 'white',
      bg: 'blue'
    }
  })

  return commands.bar
}

commands.add = function(cmd) {

  var title
  var len
  var button

  title = ' {red-fg}'
    + cmd.prefix
    + '{/red-fg}'
    + ' '
    + cmd.name;

  len = (cmd.prefix + ' ' + cmd.name).length

  button = blessed.button({
    parent: commands.bar,
    name: cmd.name,
    top: 0,
    left: drawn + 1,
    height: 1,
    content: title,
    width: len + 2,
    align: 'left',
    tags: true,
    mouse: true,
    style: {
      fg: 239,
      bg: 'blue',
      hover: {
        fg: 'white',
        bg: 'blue'
      },
      focus: {
        fb: 'black',
        bg: 'white'
      }
    }
  })

  commands.bar._[cmd.name] = button
  cmd.element = button

  if (cmd.callback) {
    button.on('press', cmd.callback)
    if (cmd.keys) {
      commands.screen.key(cmd.keys, cmd.callback)
    }
  }

  drawn += len + 3;
}

module.exports = commands
