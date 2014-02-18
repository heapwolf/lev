var blessed = require('blessed')
var client = require('../client')
var output = require('./output')
var utils = require('../utils')

function Tree(screen, model) {

  var tree = Tree.tree

  if (tree) {
    tree.detach()
    screen.append(tree)
    return tree
  }

  tree = Tree.tree = blessed.list({
    parent: screen,
    hidden: true,
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    label: '{black-fg}{white-bg}┤ {red-fg}Tree{/red-fg} ├{/black-fg}{/white-bg}',
    width: 'half',
    height: 'half',
    left: 'center',
    top: 'center',
    hidden: true,
    padding: {
      top: 1,
      bottom: 1
    },
    style: {
      bg: 'white',
      fg: 'black',
      item: {
        hover: {
          bg: 239,
          fg: 'black'
        }
      }
    },
    border: {
      bg: 'white',
      fg: 'black',
      type: 'ascii'
    }
  })

  var bounce
  tree.on('select', function() {
    clearTimeout(bounce)
    bounce = setTimeout(function() {
      var item = tree.items[tree.selected].content.replace(/[^\w]/g, '')
      output.log(item)
    }, 100)
  })

  return tree
}

Tree.update = function(model) {

  var tree = Tree.tree

  var l = tree.items.length

  if (l > 0) {
    while(l--) {
      tree.removeItem(l)
    }
  }

  var sublevels = client.getSublevels()

  var subtree = utils.walkObject('', sublevels)
  var items = utils.archify(subtree).split('\n')

  items.forEach(function(key) {
    if (key != '') {
      tree.add(key)
    }
  })

  tree.parent.render()
  tree.setFront()
  tree.focus()
}

module.exports = Tree
