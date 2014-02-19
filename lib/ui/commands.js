var blessed = require('blessed')
var output = require('./output')
var drawn = 0

function Commands(screen) {

  var commands = Commands.commands

  if (commands) {
    commands.detach()
    screen.append(commands)
    return commands
  }

  commands = Commands.commands = blessed.box({
    parent: screen,
    left: 0,
    tags: true,
    right: 0,
    bottom: 0,
    height: 1,
    align: 'right',
    style: {
      fg: 'white',
      bg: 243
    }
  })

  return commands
}

Commands.update = function(str) {
  Commands.commands.content = str
  Commands.commands.parent.render()
}

Commands.add = function(cmd) {

  var commands = Commands.commands
  var title
  var len
  var button

  title = ' {153-fg}'
    + cmd.prefix
    + '{/153-fg}'
    + ' '
    + cmd.name;

  len = (cmd.prefix + ' ' + cmd.name).length

  button = blessed.button({
    parent: commands,
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
      fg: 'white',
      bg: 243,
      hover: {
        fg: 'white',
        bg: 'black'
      },
      focus: {
        fg: 'white',
        bg: 'black'
      }
    }
  })

  cmd.element = button

  if (cmd.callback) {
    button.on('press', cmd.callback)
    if (cmd.keys) {
      commands.parent.key(cmd.keys, cmd.callback)
    }
  }

  drawn += len + 3;
}

module.exports = Commands
