var blessed = require('blessed')
var utils = require('../utils')

function Info(screen, model, client) {

  var info = Info.info

  if (info) {
    info.detach()
    screen.append(info)
    return info
  }

  info = Info.info = blessed.box({
    parent: screen,
    hidden: true,
    keys: true,
    vi: true,
    align: 'center',
    mouse: true,
    tags: true,
    label: '{247-bg} {black-fg}INFO{/black-fg} {/247-bg}',
    width: 54,
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

  info._.usageLabelText = 'Disk usage '
  info._.client = client

  info._.usageLabel = blessed.element({
    parent: info,
    content: info._.usageLabelText,
    left: 2,
    right: 2,
    top: 2,
    height: 1,
    style: {
      bg: 'white',
      fg: 'black',
    }
  })

  info._.header = blessed.element({
    parent: info,
    left: 2,
    right: 2,
    top: 5,
    height: 3,
    style: {
      bg: 'white',
      fg: 'black',
    }
  })

  info._.progressbar = blessed.progressbar({
    parent: info,
    fg: 'blue',
    bg: 'default',
    barBg: 243,
    barFg: 243,
    style: {
      bg: 247
    },
    ch: ' ',
    height: 1,
    right: 2,
    left: 2,
    top: 3,
    filled: 50
  })

  info._.stats = blessed.list({
    parent: info,
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    top: 8,
    left: 1,
    right: 1,
    bottom: 1,
    style: {
      bg: 'white',
      fg: 'black',
      item: {
        hover: {
          bg: 239,
          fg: 'white'
        }
      }
    }
  })

  info.setFront()

  return info
}

Info.update = function(model, cb) {

  var info = Info.info

  var l = info._.stats.items.length

  if (l > 0) {
    while(l--) {
      info._.stats.removeItem(l)
    }
  }

  info._.client.getInfo(function(err, data) {
    if (err) return cb(err)

    var items = data.stats.split('\n')
    var header = items.splice(0, 3).join('\n').replace(/-/g, '─')

    info._.header.setContent(header)

    items.forEach(function(key) {
      if (key != '') {
        info._.stats.add(key)
      }
    })

    var total = data.disk/100
    var value = data.size/total
    var progress = value > 1 ? value : 2
    info._.usageLabel.content = info._.usageLabelText + value + '%'
    info._.progressbar.setProgress(progress)

    info.parent.render()
    cb()
  })
}

module.exports = Info
