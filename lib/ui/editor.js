var blessed = require('blessed')
var output = require('./output')

//
// experimental editor, not using atm...
//

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
  var inputbounce = null

  parent.on('keypress', function fn(ch, key) {

    clearTimeout(inputbounce)
    inputbounce = setTimeout(function() {

      var length = 1
      var del = false
      var enter = false
      var delline = false
      var size = that.getProfile()
      var autoscroll = false

      function update() {
        
        var tmp = []
        var flat = tmp.concat.apply(tmp, that.data.fake).join('\n')

        that.parent.setContent(flat)
        that.update(flat, autoscroll)
        screen.render()
      }

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
        var lpos = that.data.rtof[that.y]
        var line = that.data.fake[lpos]

        if (that.cursorX == 1 && lpos != 0) {

          var prevLine = that.data.fake[lpos-1]
          var prevLineLen = prevLine.length
          var leftover = that.data.fake.splice(lpos, 1)

          //
          // if there are leftovers, append them 
          // to the line above this one.
          //
          if (leftover.length > 0) {
            that.data.fake[lpos-1] += leftover
          }

          ch = null
          delline = true
          
          if (that.y < size.height) {
            that.up()
          }
          else {
            --that.y
            --this.cursorY
          }

          that.x = (prevLineLen || 0)
          that.cursorX = ((prevLineLen+1) || 1)
          if (prevLineLen > 0) {
            that.program.cuf(prevLineLen)
          }
          update()
        }
        else {
          length = -1
          del = true
        }

        // output.log('cury: %d, y: %d, curx: %d, x: %d', that.cursorY, that.y, that.cursorX, that.x)
      }
      else if (key.name == 'tab') {
        ch = '  '
        length = 2
      }

      if (ch || length == -1) {

        var fpos = that.data.rtof[that.y]
        var line = that.data.fake[fpos]

        if (typeof line == 'undefined') return

        var farr = line.split('')
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
          else if (that.y > size.height) {
            that.program.cup(that.cursorY+2, size.left)            
          }
          else {
            ++that.cursorY
            that.program.cup(that.cursorY+1, size.left)
          }
        }

        if (!delline) {
          that.data.fake[fpos] = farr.join('')
        }

        update()
      }
    }, 15)
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
// move the cursor, but only within the bounds of a jagged the array.
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

    //output.log('\0')
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

    //output.log('\0')
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

Editor.prototype.blur = function() {
  this.program.hideCursor()
  this.reset()
  this.screen.context = null
}

Editor.prototype.scroll = function(n) {
  var scroll = this.parent.getScroll()
  this.parent.setScroll(scroll+n)
}

Editor.prototype.reset = function() {
  this.x = 0
  this.y = 0
  this.cursorX = 1
  this.cursorY = 1
  this.parent.setScroll(0)
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