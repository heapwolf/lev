var blessed = require('blessed')
var output = require('./output')
var keylist = require('./keylist')
var fs = require('fs')
var path = require('path')
var Editor = require('./editor')

function manifests(screen, data) {

  var width = 25
  var program = blessed.program()

  manifests.box = blessed.box({
    parent: screen,
    mouse: true,
    keys: true,
    label: ' Manifests ',
    vi: true,
    align: 'left',
    border: {
      type: 'ascii'
    },
    style: {
      scrollbar: {
        inverse: true
      },
      selected: {
        bg: 'blue'
      },
      item: {
        hover: {
          bg: 'blue'
        }
      }
    },
    left: 'center',
    top: 'center',
    width: 'half',
    height: 'half',
    hidden: true,
    fg: 'blue'
  })

  manifests.current = blessed.box({
    parent: manifests.box,
    scrollable: true,
    mouse: true,
    keys: true,
    vi: true,
    align: 'left',
    left: width + 1,
    top: 1,
    right: 1,
    bottom: 1,
    fg: 'gray'
  })

  var editor = Editor(manifests.current, screen)

  manifests.current.on('focus', function() {
    program.showCursor()
  })

  manifests.current.key('up', function() {
    editor.up()
  })

  manifests.current.key('down', function() {
    editor.down()
  })

  manifests.current.key('right', function() {
    editor.right()
  })

  manifests.current.key('left', function() {
    editor.left()
  })

  manifests.list = blessed.list({
    parent: manifests.box,
    mouse: true,
    keys: true,
    vi: true,
    left: 1,
    top: 1,
    bottom: 1,
    width: width,
    align: 'left',
    tags: true,
    items: ['Default', 'Secondary'],
    scrollbar: {
      ch: ' '
    },
    style: {
      scrollbar: {
        inverse: true
      },
      fg: 'blue',
      selected: {
        bg: 'blue'
      },
      item: {
        hover: {
          bg: 'blue'
        }
      }
    }
  })

  var fromFile = blessed.button({
    parent: manifests.box,
    bottom: 1,
    height: 1,
    left: 3,
    width: 16,
    content: ' Load From File',
    align: 'center',
    bg: 'black',
    hoverBg: 'blue',
    autoFocus: false,
    mouse: true,
  })
  .on('press', function() {
    manifests.box.hide()
    fm.pick(process.cwd(), function(err, fname) {
      var EBADPATH = path.extname(fname) !== '.json'
      if (err || EBADPATH) {
        return output.error('NOT OK!', err || 'Bad manifest')
      }
      fs.readFile(fname, function(err, data) {
        if (err) return output.error('NOT OK!', err)
        var json = JSON.parse(data.toString())
        var text = JSON.stringify(json, 2, 2)
        manifests.current.setContent(text)
        manifests.box.show()
        screen.render()
        program.showCursor()
        editor.update(text)
        manifests.current.focus()
        // manifests.current.readInput(function(a, b) {
        //   console.log(a, b)
        // })
      })
    })
  })

  var fm = blessed.filemanager({
    parent: screen,
    label: ' Please select a {blue-fg}manifest.json{/blue-fg} ',
    border: {
      type: 'ascii'
    },
    scrollbar: {
      ch: ' '
    },
    style: {
      scrollbar: {
        inverse: true
      },
      selected: {
        bg: 'blue'
      },
      item: {
        hover: {
          bg: 'blue'
        }
      }
    },
    mouse: true,
    keys: true,
    vi: true,
    left: 'center',
    top: 'center',
    width: 'half',
    height: 'half',
    hidden: true
  })

  manifests.list.key('enter', function() {
    output.log('ok')
  })

  manifests.list.key('escape', function() {
    manifests.toggle(screen)
  })

  var sep = blessed.line({
    parent: manifests.box,
    orientation: 'vertical',
    left: width,
    top: 1,
    bottom: 1
  })

  var cap_upper = blessed.element({
    parent: manifests.box,
    content: '┬',
    left: width,
    top: 0,
    width: 1,
    height: 1
  })

  var cap_lower = blessed.element({
    parent: manifests.box,
    content: '┴',
    left: width,
    bottom: 0,
    height: 1,
    width: 1
  })

  return manifests.list
}

manifests.toggle = function(screen) {
  manifests.box.toggle()
  if (manifests.box.visible) {
    manifests.list.focus()
  }
  else {
    keylist.list.focus()
  }
  screen.render()
}

module.exports = manifests
