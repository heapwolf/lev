var blessed = require('blessed')
var output = require('./output')

function Editor(screen, parent) {

  if (!(this instanceof Editor)) {
    return new Editor(screen, parent)
  }

  this.screen = screen
  this.parent = parent
  this.parent.keys = false
  this.program = blessed.program()

  this.parent.on('focus', this.focus.bind(this))
  this.parent.on('blur', this.blur.bind(this))

  this.parent.key('up', this.up.bind(this))
  this.parent.key('down', this.down.bind(this))
  this.parent.key('right', this.right.bind(this))
  this.parent.key('left', this.left.bind(this))

  var that = this
  var bounce = null

  parent.on('keypress', function fn(ch, key) {

    clearTimeout(bounce)
    bounce = setTimeout(function() {

      var length = 1
      var del = false
      var enter = false
      var delline = false
      var size = that.getProfile()
      var autoscroll = false

      if (key.name == 'escape') {
        return
      }

      if (key.name == 'enter') {
        enter = true
        ch = '\n'
      }
      else if (key.name == 'backspace') {
        
        //
        // delete from the start of a line,
        // should send the cursor up and to the
        // end of the line above.
        //
        var l = that.data.rtof[that.y]

        if (that.data.fake[l].length == 0) {

          var prevLineLen = that.data.fake[l-1].length
          that.data.fake.splice(l, 1)

          //output.log('prevLineLen: %d',prevLineLen)
          output.log('removing line')

          ch = null
          delline = true
          that.up()
          that.x = prevLineLen
          that.cursorX = (prevLineLen || 1)
          if (prevLineLen > 0) {
            that.program.cuf(prevLineLen)
          }

          //output.log('moving to cx:%d, x:%d, y: %d', that.cursorX, that.x, that.y)
        }
        else {
          length = -1
          del = true
        }

        output.log('cy: %d, y: %d', that.cursorY, that.y)
      }
      else if (key.name == 'tab') {
        ch = '  '
        length = 2
      }

      if (ch || length == -1) {

        var fpos = that.data.rtof[that.y]
        var farr = that.data.fake[fpos].split('')
        var co = that.parent._getCoords()
        var index = that.x
        var y = that.cursorY-1

        if (farr.length > size.width && y > fpos) {
          var diff = y - fpos
          index += (size.width * (diff)) - diff
        }

        if (del && that.cursorX > 1) {
          farr.splice(index-1, 1)
          --that.x
          --that.cursorX
          that.program.cub(1)
        }
        else if (!del && !enter) {
          farr.splice(index, 0, ch)

          if (that.cursorX <= size.width) {
            that.x += length
            that.cursorX += length
            that.program.cuf(length)
          }
        }
        else if (enter) {
          farr.splice(index, 0, ch)
          that.cursorX = 1
          that.x = 0
          ++that.y

          if (that.cursorY == size.height) {
            that.scroll(1)
            that.program.cup(that.cursorY+1, size.left)
            autoscroll = true
          }
          else {
            ++that.cursorY
            that.program.cup(that.cursorY+1, size.left)
          }
        }

        if (!delline) {
          that.data.fake[fpos] = farr.join('')
        }

        var tmp = []
        var flat = tmp.concat.apply(tmp, that.data.fake).join('\n')

        output.log(that.data.fake)

        that.parent.setContent(flat)
        that.update(flat, autoscroll)
        screen.render()
      }
    }, 1)
  })
}

module.exports = Editor

Editor.prototype.update = function(s, autoscroll) {
  var co = this.parent._getCoords()
  this.data = this.parent._wrapContent(s, co.xl - co.xi)
  if (autoscroll) {
    var scrollHeight = this.parent.getScrollHeight()
    this.parent.scrollTo(scrollHeight)
  }
}

//
// move the cursor, but only within the bounds of jagged the array.
//
Editor.prototype.up = function() {
  if (this.y > 0) {

    var height = this.getProfile().height
    var prevLineLen = this.data[this.y-1].length
    
    if (this.x > prevLineLen) {
      var diff = this.x - prevLineLen
      this.x = prevLineLen
      this.cursorX = prevLineLen+1
      this.program.cub(diff)
    }
    --this.y
    
    if (this.cursorY > 1) {
      this.program.cuu(1)
      --this.cursorY
    }

    if (this.y > 0 && this.cursorY == 1) {
      this.scroll(-1)
    }

    output.log('y: %d/%d, cy: %d/%d', this.y, this.data.length-1, this.cursorY, height)
    
  }
}

Editor.prototype.down = function() {
  if (typeof this.data[this.y+1] != 'undefined') {
    var nextLineLen = this.data[this.y+1].length
    
    if (this.x > nextLineLen) {
      var diff = this.x - nextLineLen
      this.x = nextLineLen
      this.cursorX = nextLineLen+1
      this.program.cub(diff)
    }
    ++this.y

    var height = this.getProfile().height
    
    if (this.y >= height) {
      this.scroll(1)
    }
    
    if (this.cursorY < height) {
      this.program.cud(1)
      ++this.cursorY
    }

    output.log('y: %d/%d, cy: %d/%d', this.y, this.data.length-1, this.cursorY, height)
  }
}

Editor.prototype.left = function() {
  if (this.x > 0) {
    --this.x
    --this.cursorX
    this.program.cub(1)
  }
}

Editor.prototype.right = function() {
  if (this.cursorX <= this.data[this.y].length) {
    ++this.x
    ++this.cursorX
    this.program.cuf(1)
  }
}

Editor.prototype.focus = function() {
  var co = this.parent._getCoords()
  var padding = this.parent.padding

  this.update(this.parent.getContent())
  this.screen.context = 'editor'
  this.reset()
  this.program.cup(0, 0)
  this.program.cud(co.yi + padding.top)
  this.program.cuf(co.xi + padding.left)
  this.program.showCursor()
}

Editor.prototype.scroll = function(n) {
  var scroll = this.parent.getScroll()
  this.parent.setScroll(scroll+n)
}

Editor.prototype.getProfile = function() {
  var co = this.parent._getCoords()
  var padding = this.parent.padding
  var paddingV = (padding.top || 0) + (padding.bottom || 0)
  var paddingH = (padding.left || 0) + (padding.right || 0)

  return {
    height: co.yl - co.yi - paddingV,
    width: co.xl - co.xi - paddingH,
    top: co.yi + padding.top,
    left: co.xi + padding.left
  }
}

Editor.prototype.blur = function() {
  this.program.hideCursor()
  this.reset()
  this.screen.context = null
}

Editor.prototype.reset = function() {
  this.x = 0
  this.y = 0
  this.cursorX = 1
  this.cursorY = 1
}
