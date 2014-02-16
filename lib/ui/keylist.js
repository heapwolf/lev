var blessed = require('blessed')

function List(screen, items) {

  var width = '30%'

  List.list = blessed.list({
    parent: screen,
    mouse: true,
    keys: true,
    vi: true,
    left: 0,
    top: 0,
    padding: {
      top: 2
    },
    height: '70%',
    width: width,
    align: 'left',
    tags: true,
    items: items,
    scrollbar: {
      ch: ' '
    },
    style: {
      scrollbar: {
        inverse: true
      },
      fg: function(el) {

        if (el.content[0] == '[' && el.content[el.content.length-1] == ']') {
          return 'gray'
        }
        return 'blue'

        // if (el.type === 'box' && el.parent.type === 'list') {
        //   var app = data._apps[el.parent.ritems.indexOf(el.content) - 1];
        //   if (!app) return 'light-blue';
        //   if (app.state === 'stopped') return 'black';
        //   if (app.state === 'started') return 'green';
        //   return -1;
        // }
        // return -1;
      },
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

  return List.list
}

module.exports = List
