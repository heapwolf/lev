var blessed = require('blessed')
var client = require('../client')
var output = require('./output')
var keylist = require('./keylist')

function Query(screen, model) {

  var query = Query.prompt

  if (query) {
    query.detach()
    screen.append(query)
    return query
  }

  query = Query.query = blessed.box({
    parent: screen,
    hidden: true,
    tags: true,
    label: '{247-bg} {black-fg}QUERY{/black-fg} {/247-bg}',
    width: '40%',
    height: 13,
    left: 'center',
    top: '20%',
    style: {
      bg: 'white',
      fg: 'black'
    },
    border: {
      bg: 'white',
      fg: 247,
      type: 'ascii'
    }
  })

  Query.form = blessed.form({
    parent: query,
    mouse: true,
    keys: true,
    vi: true,
    bg: 'white',
    fg: 'black',
    left: 1,
    right: 1,
    top: 1,
    bottom: 1
  })

  var sep_h2 = blessed.line({
    parent: query,
    orientation: 'horizontal',
    left: 0,
    style: {
      bg: 'white',
      fg: 247,
    },
    bottom: 2,
    right: 0
  })

  var cap_left = blessed.element({
    parent: query,
    content: '├',
    left: 0,
    style: {
      bg: 'white',
      fg: 247,
    },
    bottom: 2,
    width: 1,
    height: 1
  })

  var cap_right = blessed.element({
    parent: query,
    content: '┤',
    right: 0,
    bottom: 2,
    style: {
      bg: 'white',
      fg: 247,
    },
    width: 1,
    height: 1
  })

  var buttonExec = blessed.button({
    parent: Query.form,
    bottom: 0,
    height: 1,
    right: 1,
    width: 6,
    content: ' Exec ',
    align: 'center',
    style: {
      bg: 243,
      fg: 'white',
      focus: {
        bg: 'black'
      }
    },
    hoverBg: 'black',
    hoverFg: 'white',
    autoFocus: true,
    mouse: true,
  })

  var formLabel = blessed.element({
    parent: Query.form,
    content: 'Start\n\nEnd\n\nReverse\n\nLimit',
    left: 1,
    style: {
      bg: 'white',
      fg: 'black',
    },
    top: 1,
    width: 15,
    height: 8
  })

  var textStart = blessed.textbox({
    parent: Query.form,
    mouse: true,
    keys: true,
    bg: 243,
    fg: 'white',
    hoverBg: 'black',
    height: 1,
    right: 1,
    left: 17,
    top: 1,
    name: 'text'
  })

  var textEnd = blessed.textbox({
    parent: Query.form,
    mouse: true,
    keys: true,
    bg: 243,
    fg: 'white',
    hoverBg: 'black',
    height: 1,
    right: 1,
    left: 17,
    top: 3,
    name: 'text'
  })

  var checkReverse = blessed.checkbox({
    parent: Query.form,
    mouse: true,
    keys: true,
    shrink: true,
    style: {
      bg: 'white',
      fg: 'black'
    },
    height: 1,
    left: 17,
    top: 5,
    name: 'check',
    content: 'Reverse results'
  })

  var textLimit = blessed.textbox({
    parent: Query.form,
    mouse: true,
    keys: true,
    bg: 243,
    fg: 'white',
    hoverBg: 'black',
    height: 1,
    width: 10,
    left: 17,
    value: '1000',
    top: 7,
    name: 'text'
  })

  // Query.form.on('focus', function() {
  //   textStart.readInput()
  // })

  textStart.on('focus', function() {
    textStart.readInput()
  })

  textEnd.on('focus', function() {
    textEnd.readInput()
  })

  textLimit.on('focus', function() {
    textLimit.readInput()
  })

  buttonExec.on('click', function() {
    model.query.start = textStart.getValue()
    model.query.end = textEnd.getValue()
    model.query.reverse = checkReverse.checked
    model.query.limit = textLimit.getValue()

    client.query(model, function(err, keys) {
      if (err) return output.log(err)
      keylist.update(keys)
      query.hide()
      screen.render()
    })
  })

  return query
}

Query.focus = function() {
  Query.form.focus()
}

module.exports = Query
