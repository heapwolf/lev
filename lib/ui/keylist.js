var blessed = require('blessed')
var Output = require('./output')
var values = require('./values')

function List(screen, model, client) {

  var list = List.list

  if (list) {
    list.detach()
    screen.append(list)
    return list
  }

  list = List.list = blessed.list({
    parent: screen,
    name: 'keylist',
    mouse: true,
    keys: true,
    vi: true,
    left: 0,
    top: 0,
    padding: {
      top: 1,
      bottom: 1
    },
    height: '70%',
    width: '50%',
    align: 'left',
    tags: true,
    items: [],
    scrollbar: {
      ch: ' '
    },
    border: {
      bg: 243,
      fg: 'black',
      type: 'ascii'
    },
    style: {
      scrollbar: {
        inverse: true
      },
      bg: 243,
      fg: function(el) {
        if (el.content[0] == '[' && el.content[el.content.length-1] == ']') {
          return 153
        }
        return 'white'
      },
      focus: {
        border: {
          fg: 'white'
        }
      },
      selected: {
        fg: 'black',
        bg: 'white'
      }
    }
  })

  list._.client = client

  var activeTitle = '{white-bg}{black-fg} KEY {/white-bg}{/black-fg}'
  var inactiveTitle = '{black-bg}{white-fg} KEY {/black-bg}{/white-fg}'

  list.on('focus', function() {
    label.setContent(activeTitle)
    list.parent.render()
  })

  list.on('blur', function() {
    label.setContent(inactiveTitle)
    list.parent.render()
  })

  var label = blessed.element({
    parent: screen,
    content: inactiveTitle,
    left: '2%',
    tags: true,
    width: 5,
    height: 1
  })

  // function isJSON(str) {
  //   try {
  //     JSON.parse(str)
  //   } catch (e) {
  //     return false
  //   }
  //   return true
  // }

  function selectKey(key) {

    client.get(key, function(err, value) {
      if (err) return // logged by the client

      var name = model.settings.connection
      var conn = model.settings.connections[name]

      if (conn.valueEncoding == 'json') {
        try {
          value = JSON.stringify(value, 2, 2)
        }
        catch(ex) {
        }
      }

      values.update({
        key: key,
        value: value
      })

      model.key = key
      model.value = value

      list.parent.render()
    })
  }

  var bounce
  list.on('select', function() {

    if (!list.items) return

    clearTimeout(bounce)
    bounce = setTimeout(function() {

      if (!list.items[list.selected]) return
      var key = list.items[list.selected].content
      if (List.isSublevel(key)) {

        model.key = key.substring(1, key.length-1)
        client.selectSublevel(function(err, keys) {
          if (err) return Output.log('NOT OK!', err)
          List.update(keys)
        })
      }
      else {
        selectKey(key)
      }
    }, 1)
  })

  return List.list
}

List.focus = function() {
  List.list.focus()
}

List.isSublevel = function(key) {
  if (key && key[0] == '[' && key[key.length-1] == ']') {
    key = key.slice(1)
    key = key.slice(0, -1)
    return key
  }
  return
}

List.update = function(keys) {

  var list = List.list
  var screen = list.parent

  var l = list.items.length

  if (l > 0) {
    while(l--) {
      list.removeItem(l)
    }
  }

  var sublevels = list._.client.getSublevels(null, function(sublevels) {

    if (Array.isArray(sublevels) && sublevels.length) {
      keys = keys.concat(sublevels)
    }

    list.setItems(keys)
    screen.render()
  //  list.focus()

  })
}

module.exports = List
