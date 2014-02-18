var blessed = require('blessed')
var client = require('../client')
var output = require('./output')
var values = require('./values')

function isSublevel(key) {
  if (key && key[0] == '[' && key[key.length-1] == ']') {
    key = key.slice(1)
    key = key.slice(0, -1)
    return key
  }
  return
}

function List(screen, model) {

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
      bg: 'blue',
      fg: 239,
      type: 'ascii'
    },
    style: {
      scrollbar: {
        inverse: true
      },
      bg: 'blue',
      fg: function(el) {

        if (el.content[0] == '[' && el.content[el.content.length-1] == ']') {
          return 'white'
        }
        return 'black'
      },
      focus: {
        border: {
          fg: 'white'
        }
      },
      selected: {
        fg: 'black',
        bg: 'white'
      },
      item: {
        hover: {
          fg: 'red',
          bg: 'white'
        }
      }
    }
  })

  function selectKey(key) {
    
    client.get('Default', key, function(err, value) {

      try {
        value = JSON.stringify(value, 2, 2)
      }
      catch(ex) {
      }

      values.update({
        key: key,
        value: value
      })

      list.parent.render()
    })
  }

  var bounce
  list.on('select', function() {
    if (!list.items) return
    clearTimeout(bounce)
    bounce = setTimeout(function() {
      var key = list.items[list.selected].content
      if (isSublevel(key)) {

        model.key = key.substring(1, key.length-1)
        client.selectSublevel(model, function(err, keys) {
          if (err) return output.log('NOT OK!', err)
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

List.update = function(keys) {

  var list = List.list
  var screen = list.parent

  var l = list.items.length

  if (l > 0) {
    while(l--) {
      list.removeItem(l)
    }
  }

  var sublevels = client.getSublevels()

  if (Array.isArray(sublevels) && sublevels.length) {
    keys = keys.concat(sublevels)
  }

  keys.forEach(function(key) {
    list.add(key)
  })
  
  screen.render()
//  list.focus()
}

module.exports = List
