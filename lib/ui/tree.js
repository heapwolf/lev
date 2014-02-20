var blessed = require('blessed')
var output = require('./output')
var utils = require('../utils')

function Tree(screen, model, client) {

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
    align: 'center',
    content: '\n No sublevels from this level.',
    mouse: true,
    tags: true,
    label: '{247-bg} {black-fg}TREE{/black-fg} {/247-bg}',
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
          fg: 'white'
        }
      }
    },
    border: {
      bg: 'white',
      fg: 247,
      type: 'ascii'
    }
  })

  var bounce
  tree.on('select', function() {
    clearTimeout(bounce)
    bounce = setTimeout(function() {
      var item = tree.items[tree.selected].content.replace(/[^\w]/g, '')
      //output.log(item)
    }, 100)
  })

  tree._.client = client

  tree.setFront()

  return tree
}

Tree.update = function(model) {

  var tree = Tree.tree
  tree.align = 'left'

  var l = tree.items.length

  if (l > 0) {
    while(l--) {
      tree.removeItem(l)
    }
  }

  tree._.client.getSublevels(null, function(err, sublevels) {

    if (err) return // error logged by client

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
  })
}

module.exports = Tree
