var blessed = require('blessed')

function Screen() {
  var global = blessed.Screen.global;
  var screen = blessed.Screen.global || blessed.screen({ tput: true });

  if (!global) {
    screen.program.key('C-c', function() {
      return process.exit(0);
    });
  }

  return screen;
}

module.exports = Screen
