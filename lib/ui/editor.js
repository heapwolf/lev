var blessed = require('blessed')
var output = require('./output')
var chars = /^[ -~]$/

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

  parent.key('enter', this.enter.bind(this))
  parent.key('backspace', this.backspace.bind(this))
  parent.on('keypress', this.insert.bind(this))
}

module.exports = Editor

var bounce

function render() {

  //
  // handy for debugging
  //
  
  // var profile = this.getProfile()
  // output.log(

  //   'map-x: %d/%d, cursor-x: %d/%d, map-y: %d/%d, cursor-y: %d/%d',
    
  //   this.x, this.data[this.y] && this.data[this.y].length-1, 
  //   this.cursorX, profile.width,

  //   this.y, this.data.length-1, 
  //   this.cursorY, profile.height
  // )

  screen.render()
}

Editor.prototype.refresh = function(autoscroll) {
 
  var co = this.parent._getCoords() 
  var fake = this.parent._clines.fake
  var tmp = []
  var flat = tmp.concat.apply(tmp, fake).join('\n')

  this.parent.setContent(flat)
  this.parent._wrapContent(flat, co.xl - co.xi)
  this.data = this.parent._clines

  if (autoscroll) {

    var scrollHeight = this.parent.getScrollHeight()
    this.parent.scrollTo(scrollHeight)
  }

  screen.render()
}

Editor.prototype.backspace = function() {

  var that = this
  var profile = that.getProfile()
  var refY = that.data.rtof[that.y]
  var line = that.data.fake[refY].split('')
  var len = that.data.fake.length
  var index = that.x

  var overflow = Math.ceil(line.length / (profile.width)) - 1
  var overflowOffset = that.y - refY

  //
  // Scenario A:
  //
  // Delete from the start of a line, should send the cursor up 
  // and to the end of the line above. If this line is wrapped
  // we need to recalculate
  //
  if (that.cursorX == 1 && refY != 0) {

    var prevLine = that.data.fake[refY - 1]
    var scrollHeight = that.parent.getScrollHeight()
    var scrollPerc = this.parent.getScrollPerc()
    var leftover = null

    if (overflow > 0 && overflowOffset > 0 && that.x > 0) {

      for (var i = 0; i < overflowOffset; i++) {
        index += that.data[refY + i].length
      }

      line.splice(index - 1, 1)
      that.data.fake[refY] = line.join('')
    }
    else {
      leftover = that.data.fake.splice(refY, 1)
    }

    //
    // if there are leftovers, they should be appended
    // to the line above the current one.
    //
    if (leftover && leftover.length > 0) {
      that.data.fake[refY - 1] += leftover
    }

    if (scrollPerc < 100 && scrollHeight > profile.height) {

      --this.cursorY
      that.program.cuu(1)
    }
    else if (scrollPerc == 100) {

      // hmm... some editors allow the cursor to go beyond 
      // the actual value and show a complete empty page.
      // possibly do that but this editor may be used more
      // like a textbox...
    }
    else {
      --this.cursorY
      that.program.cuu(1)
    }

    --that.y

    if (overflow > 0 && overflowOffset > 0 && that.x > 0) {

      that.x = that.data[that.y].length - 1
      that.cursorX = that.x
      that.program.cuf(that.x)
    }
    else {

      var prevLineLen = that.data[that.y].length

      that.x = (prevLineLen || 0)
      that.cursorX = ((prevLineLen + 1) || 1)

      if (prevLineLen > 0) {
        that.program.cuf(prevLineLen)
      }
    }
  }

  //
  // Scenario B:
  // A character is removed from the current line at 
  // the current x index. However if this is a line that
  // wrapps we need to recalculate the x index.
  //
  else if (that.cursorX > 1) {

    if (overflow && overflowOffset > 0) {
      for (var i = 0; i < overflowOffset; i++) {
        index += that.data[refY + i].length
      }
    }

    line.splice(index-1, 1)
    that.data.fake[refY] = line.join('')

    --that.x
    --that.cursorX
    that.program.cub(1)
  }

  that.refresh()

  render.call(this)
}

Editor.prototype.insert = function(ch, key) {

  if (chars.test(ch)) {

    var that = this
    var profile = that.getProfile()

    var refY = that.data.rtof[that.y]
    var line = that.data.fake[refY]
    var overflow = Math.ceil(line.length / profile.width) - 1
    var overflowOffset = that.y - refY
    var farr = line.split('')
    var index = that.x
    var autoscroll = false

    //
    // if the line has overflow/wrap, get each previous
    // wrapped line length and add it to the index.
    //
    if (overflow > 0 && overflowOffset > 0) {
      for (var i = 0; i < overflowOffset; i++) {
        index += that.data[refY + i].length
      }
    }

    if (that.cursorX <= profile.width) {

      that.x += ch.length
      that.cursorX += ch.length
      that.program.cuf(ch.length)
    }
    else {

      ++that.y
      ++that.cursorY

      that.x = that.data[that.y].length + overflowOffset
      that.cursorX = that.data[that.y].length + 1

      var y = profile.top + that.cursorY - 1
      var x = profile.left + that.cursorX

      if (that.y > profile.height) {
        autoscroll = true
      }

      //
      // the only api in the world that takes y and then x
      //
      that.program.cup(y, x)


    }

    farr.splice(index, 0, ch)
    that.data.fake[refY] = farr.join('')

    this.refresh(autoscroll)
    render.call(this)
  }
}

Editor.prototype.enter = function() {

  var that = this
  
  clearTimeout(bounce)
  bounce = setTimeout(function() {

    var profile = that.getProfile()
    var autoscroll = false

    var refY = that.data.rtof[that.y]
    var line = that.data.fake[refY].split('')
    var overflow = Math.ceil(line.length / (profile.width)) - 1
    var overflowOffset = that.y - refY
    var nextline = that.data[refY+1]
    var index = that.x

    if (that.cursorX > 1 && overflow > 0 && overflowOffset > 0) {
      for (var i = 0; i < overflowOffset; i++) {
        index += that.data[refY + i].length
      }
    }

    var right = line.splice(index, line.length - index)

    that.data.fake[refY] = line.join('')
    that.data.fake.splice(refY + 1, 0, right.join(''))

    that.cursorX = 1
    that.x = 0
    ++that.y

    if (that.cursorY == profile.height && !nextline) {
      that.scroll(1)
      autoscroll = true
    }
    else if (that.cursorY == profile.height) {
      that.scroll(1)
    }
    else if (that.cursorY < profile.height) {
      ++that.cursorY
    }

    var x = profile.left
    var y = profile.top + that.cursorY - 1

    that.program.cup(y, x)
    that.refresh(autoscroll)

    render.call(that)

  }, 20)
}

//
// move the cursor, but only within the bounds of a jagged the array.
//
Editor.prototype.up = function() {
  if (this.y > 0) {

    var profile = this.getProfile()
    var prevLineLen = this.data[this.y-1].length
    
    if (this.x > prevLineLen) {
      var diff = this.x - prevLineLen
      this.x = prevLineLen
      this.cursorX = prevLineLen+1
      this.program.cub(diff)
    }
    --this.y

    if (this.cursorY == 1) {
      this.scroll(-1)
    }
    else if (this.cursorY > 1) {
      this.program.cuu(1)
      --this.cursorY
    }

    render.call(this)
  }
}

Editor.prototype.down = function() {

  var profile = this.getProfile()

  if (typeof this.data[this.y+1] != 'undefined') {

    var nextLineLen = this.data[this.y+1].length

    if (this.x > nextLineLen) {

      var diff = this.x - nextLineLen
      this.x = nextLineLen
      this.cursorX = nextLineLen+1
      this.program.cub(diff)
    }

    ++this.y

    if (this.cursorY == profile.height) {
      this.scroll(1)
    }
    else if (this.cursorY < profile.height) {
      this.program.cud(1)
      ++this.cursorY
    }

    render.call(this)
  }
}

Editor.prototype.left = function() {
  
  var profile = this.getProfile()
  
  if (this.cursorX > 1) {
    
    --this.x
    --this.cursorX + 1
    this.program.cub(1)
  }
  else if (this.cursorX == 1 && this.cursorY > 1) {
    
    this.up()

    var len = this.data[this.y].length
    
    if (len > 0) {
      this.cursorX = len + 1
      this.x = len
      this.program.cuf(len)
    }
  }

  render.call(this)
}

Editor.prototype.right = function() {
  
  var profile = this.getProfile()
  var next = typeof this.data[this.y+1] != 'undefined'

  if (this.cursorX == profile.width || 
      (this.x == this.data[this.y].length && next)) {

    this.down()
    this.cursorX = 1
    this.x = 0

    var len = this.data[this.y].length

    if (len > 0) {
      this.program.cup(0, 0)
      this.program.cud(profile.top + this.cursorY)
      this.program.cuf(profile.left)
    }
  }
  else if (this.cursorX <= this.data[this.y].length) {

    ++this.x
    ++this.cursorX
    this.program.cuf(1)
  }

  render.call(this)
}

Editor.prototype.focus = function() {

  var profile = this.getProfile()

  this.screen._.editing = true

  this.refresh()
  this.reset()
  this.program.cup(0, 0)
  this.program.cud(profile.top)
  this.program.cuf(profile.left)
  this.program.showCursor()
}

Editor.prototype.blur = function() {
  this.program.hideCursor()
  this.reset()
  this.screen._.editing = false
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
  var border = this.parent.border

  var profile = {
    height: co.yl - co.yi,
    width: co.xl - co.xi,
    top: co.yi,
    left: co.xi
  }

  if (padding) {
    profile.left += padding.left
    profile.right += padding.right
    profile.top += padding.top
    profile.bottom += padding.bottom
  }

  if (border) {
    profile.left += 1
    profile.top += 1
    profile.width -= 1
    profile.height -= 1
  }

  return profile
}
