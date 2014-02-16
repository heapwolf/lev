var blessed = require('blessed')
var createScreen = require('./screen')

function createPrompt() {

  var screen = createScreen();
  var prompt = createPrompt.prompt;

  if (prompt) {
    prompt.detach();
    screen.append(prompt);
    return prompt;
  }

  prompt = createPrompt.prompt = blessed.box({
    parent: screen,
    hidden: true,
    content: '',
    width: 'half',
    height: 7,
    left: 'center',
    top: 'center',
    border: {
      type: 'ascii'
    },
    tags: true
  });

  prompt._.input = blessed.textbox({
    parent: prompt,
    top: 3,
    height: 1,
    left: 2,
    right: 2,
    bg: 'black'
  });

  prompt._.okay = blessed.button({
    parent: prompt,
    top: 5,
    height: 1,
    left: 2,
    width: 6,
    content: 'Okay',
    align: 'center',
    bg: 'black',
    hoverBg: 'blue',
    autoFocus: false,
    mouse: true
  });

  prompt._.cancel = blessed.button({
    parent: prompt,
    top: 5,
    height: 1,
    shrink: true,
    left: 10,
    width: 8,
    content: 'Cancel',
    align: 'center',
    bg: 'black',
    hoverBg: 'blue',
    autoFocus: false,
    mouse: true
  });

  prompt._.type = function(text, value, callback) {
    var okay, cancel;

    if (!callback) {
      callback = value;
      value = '';
    }

    prompt.show();
    prompt.setContent(' ' + text);

    if (value) prompt._.input.value = value;

    screen.saveFocus()

    prompt._.okay.on('press', okay = function() {
      prompt._.input.submit();
    })

    prompt._.cancel.on('press', cancel = function() {
      prompt._.input.cancel();
    })

    prompt._.input.readInput(function(err, data) {
      prompt._.input.clearValue();
      prompt.hide();
      screen.restoreFocus();
      prompt._.okay.removeListener('press', okay);
      prompt._.cancel.removeListener('press', cancel);
      screen.render();
      return callback(err, data);
    })

    screen.render()
  }

  return prompt
}

module.exports = createPrompt
