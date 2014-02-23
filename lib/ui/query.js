var blessed = require('blessed')
var client = require('../client')
var keylist = require('./keylist')

function Query(screen, model, client) {

  var query = Query.query

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
    parent: query,
    bottom: 1,
    height: 1,
    right: 2,
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
    mouse: true
  })

  var qLabel = blessed.element({
    parent: query,
    content: 'Start\n\nEnd\n\nReverse\n\nLimit',
    left: 2,
    style: {
      bg: 'white',
      fg: 'black',
    },
    top: 2,
    width: 15,
    height: 8
  })

  var textStart = blessed.textbox({
    parent: query,
    mouse: true,
    keys: true,
    bg: 243,
    fg: 'white',
    hoverBg: 'black',
    height: 1,
    right: 2,
    left: 17,
    top: 2,
    name: 'text'
  })

  var textEnd = blessed.textbox({
    parent: query,
    mouse: true,
    keys: true,
    bg: 243,
    fg: 'white',
    hoverBg: 'black',
    height: 1,
    right: 2,
    left: 17,
    top: 4,
    name: 'text'
  })

  var checkReverse = blessed.checkbox({
    parent: query,
    mouse: true,
    keys: true,
    shrink: true,
    style: {
      bg: 'white',
      fg: 'black'
    },
    height: 1,
    left: 17,
    top: 6,
    name: 'check',
    content: 'Reverse results'
  })

  var textLimit = blessed.textbox({
    parent: query,
    mouse: true,
    keys: true,
    bg: 243,
    fg: 'white',
    hoverBg: 'black',
    height: 1,
    width: 10,
    left: 17,
    value: '1000',
    top: 8,
    name: 'text'
  })

  query.on('focus', function() {
    textStart.readInput()
  })

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

    client.query(function(err, keys) {
      if (err) return // error is logged by client

      query.hide()
      screen.render()
      keylist.focus()
      keylist.update(keys)
    })
  })

  return query
}

Query.focus = function() {
  Query.query.focus()
}

module.exports = Query
