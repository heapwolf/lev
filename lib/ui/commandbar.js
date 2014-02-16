var blessed = require('blessed')
var commands = require('./commands')
var output = require('./output')

function commandBar(screen, query) {

  var cmds = commands(screen, query)
  var width = 60
  var drawn = 0

  var bar = blessed.box({
    parent: screen,
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    align: 'right',
    content: 'foo',
    style: {
      fg: 'blue',
      bg: 'blue'
    }
  })

  Object.keys(cmds).forEach(function(name) {

    var cmd = cmds[name]
    var title
    var len
    var button

    title = '{yellow-fg}'
      + cmd.prefix
      + '{/yellow-fg}'
      + ':'
      + name;

    len = (cmd.prefix + ':' + name).length;

    button = blessed.button({
      parent: bar,
      top: 0,
      left: drawn + 1,
      height: 1,
      content: title,
      width: len + 2,
      align: 'left',
      tags: true,
      mouse: true,
      style: {
        fg: 'black',
        bg: 'blue',
        hover: {
          bg: 'white'
        },
        focus: {
          bg: 'white'
        }
      }
    });

    bar._[name] = button
    cmd.element = button

    if (cmd.callback) {
      button.on('press', cmd.callback)
      if (cmd.keys) {
        screen.key(cmd.keys, cmd.callback)
      }
    }

    drawn += len + 3;
  })

  return bar
}

module.exports = commandBar
