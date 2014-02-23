var blessed = require('blessed')
var output = require('./output')
var chars = /^[a-zA-Z0-9~!@#\$%\^&\*\(\)_\+`\-\=\[\]\{\}|\\\:"<>\?,\. ]$/

//
// experimental editor, not using atm...
//

function Editor(screen, parent) {

  if (!(this instanceof Editor)) {
    return new Editor(screen, parent)
  }

  var that = this

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

Editor.prototype.update = function(s, autoscroll) {
  var co = this.parent._getCoords()
  this.data = this.parent._wrapContent(s, co.xl - co.xi)
  if (autoscroll) {
    var scrollHeight = this.parent.getScrollHeight()
    this.parent.scrollTo(scrollHeight)
  }
}

Editor.prototype.refresh = function(autoscroll) {
  
  var tmp = []
  var flat = tmp.concat.apply(tmp, this.data.fake).join('\n')

  this.parent.setContent(flat)
  this.update(flat, autoscroll)
  screen.render()
}

Editor.prototype.backspace = function() {

  var that = this
  var profile = that.getProfile()
  var refY = that.data.rtof[that.y]
  var line = that.data.fake[refY].split('')

  //
  // Scenario A:
  //
  // Delete from the start of a line,
  // should send the cursor up and to the
  // end of the line above.
  //
  if (that.cursorX == 1 && refY != 0) {

    var prevLine = that.data.fake[refY-1]
    var nextLine = that.data.fake[refY+1]
    var prevLineLen = prevLine.length
    var linecount = that.data.fake.legnth
    var leftover = that.data.fake.splice(refY, 1)

    //
    // if there are leftovers, they should be appended
    // to the line above the current one.
    //
    if (leftover.length > 0) {
      that.data.fake[refY-1] += leftover
    }

    //
    // if the scrolled offest is greater than zero and we
    // are removing a line, we need to move the cursor up
    //
    if (that.parent.childBase == 0) {
      --this.cursorY
      that.program.cuu(1)
    }

    --that.y

    that.x = (prevLineLen || 0)
    that.cursorX = ((prevLineLen+1) || 1)

    if (prevLineLen > 0) {
      that.program.cuf(prevLineLen)
    }

    that.refresh(false)
  }

  //
  // Scenario B:
  // A character is removed from the current line at 
  // the current x index. However if this is a line that
  // wrapps we need to recalculate the x index.
  //
  else if (that.cursorX > 1) {

    var index = that.x
    var y = that.cursorY-1

    if (line.length > profile.width && y > refY) {
      var diff = y - refY
      index += (profile.width * diff) - diff
    }

    line.splice(index-1, 1)
    that.data.fake[refY] = line.join('')

    --that.x
    --that.cursorX
    that.program.cub(1)
    that.refresh()
  }

  output.log('y: %d/%d, cy: %d/%d', this.y, this.data.length-1, this.cursorY, profile.height)
}

Editor.prototype.insert = function(ch, key) {

  if (chars.test(ch)) {

    var that = this
    var profile = that.getProfile()

    var refY = that.data.rtof[that.y]
    var line = that.data.fake[refY]

    // if (typeof line == 'undefined') return

    var farr = line.split('')
    var index = that.x
    var y = that.cursorY-1

    if (farr.length > profile.width && y > refY) {
      var diff = y - refY
      index += (profile.width * (diff)) - diff
    }

    farr.splice(index, 0, ch)
    that.data.fake[refY] =  farr.join('')

    if (that.cursorX <= profile.width) {
      that.x += ch.length
      that.cursorX += ch.length
      that.program.cuf(ch.length)
    }

    this.refresh()
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
    var nextline = that.data.fake[refY+1]
    var right = line.splice(that.x, line.length-that.x)

    that.data.fake[refY] = line.join('')

    that.data.fake.splice(that.y+1, 0, right.join(''))

    // DO we need to consider line wrapping here?

    // // var y = that.cursorY-1

    // // if (farr.length > profile.width && y > fpos) {
    // //   var diff = y - fpos
    // //   index += (profile.width * (diff)) - diff
    // // }

    that.cursorX = 1
    that.x = 0
    ++that.y

    if (that.cursorY == profile.height-2 && !nextline) {
      that.scroll(1)
      autoscroll = true
    }
    else if (that.cursorY == profile.height-2) {
      that.scroll(1)
    }
    else if (that.cursorY < profile.height-2) {
      ++that.cursorY
    }

    that.program.cup(that.cursorY, profile.left)
    that.refresh(autoscroll)

  }, 5)
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

    //output.log('\0')
    output.log('y: %d/%d, cy: %d/%d', this.y, this.data.length-1, this.cursorY, profile.height)
    
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

    if (this.cursorY == profile.height-2) {
      this.scroll(1)
    }
    else if (this.cursorY < profile.height-2) {
      this.program.cud(1)
      ++this.cursorY
    }

    //output.log('\0')
    output.log('y: %d/%d, cy: %d/%d', this.y, this.data.length-1, this.cursorY, profile.height)
  }
}

Editor.prototype.left = function() {
  
  var profile = this.getProfile()
  
  if (this.x > 0) {
    --this.x
    --this.cursorX
    this.program.cub(1)
  }
  else if (this.x == 0 && this.cursorY > 1) {
    this.up()
    var len = this.data[this.y].length
    if (len > 0) {
      this.cursorX = len
      this.x = len
      this.program.cuf(len)
    }
  }
}

Editor.prototype.right = function() {
  
  var profile = this.getProfile()
  var next = typeof this.data.fake[this.y+1] != 'undefined'

  if (this.cursorX == profile.width || 
      // should this be fake or real?
      (this.x == this.data.fake[this.y].length && next)) { 

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
  else if (this.cursorX <= this.data.fake[this.y].length) {

    ++this.x
    ++this.cursorX
    this.program.cuf(1)
  }
}

Editor.prototype.focus = function() {

  var profile = this.getProfile()

  this.screen._.editing = true

  this.update(this.parent.getContent())
  this.reset()
  this.program.cup(0, 0)
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
  var paddingV = 0 //(padding.top || 0) + (padding.bottom || 0)
  var paddingH = 0 //(padding.left || 0) + (padding.right || 0)
  var profile = {
    height: co.yl - co.yi - paddingV,
    width: co.xl - co.xi - paddingH,
    top: co.yi, // + padding.top,
    left: co.xi+1 // + padding.left
  }
  return profile
}
