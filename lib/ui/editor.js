var blessed = require('blessed')
var output = require('./output')

function Bled(parent, screen) {

  if (!(this instanceof Bled)) {
    return new Bled(parent, screen)
  }

  this.parent = parent
  var co = this.parent._getCoords()
  this.program = blessed.program()
  this.program.cud(co.yi)
  this.program.cuf(co.xi)

  this.x = 0
  this.y = 0
  this.cursorX = 1
  this.cursorY = 1

  var that = this

  var bounce = null

  parent.on('keypress', function fn(ch, key) {

    clearTimeout(bounce)
    bounce = setTimeout(function() {

      var length = 1
      var del = false
      var enter = false

      if (key.name == 'enter') {
        enter = true
        ch = '\n'
      }
      else if (key.name == 'backspace') {
        length = -1
        del = true
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
        var width = co.xl - co.xi
        var y = that.cursorY-1

        if (farr.length > width && y > fpos) {
          var diff = y - fpos
          index += (width * (diff)) - diff
        }

        if (del && that.cursorX > 1) {
          farr.splice(index-1, 1)
          --that.x
          --that.cursorX
          that.program.cub(1)
        }
        else if (!del && !enter) {
          farr.splice(index, 0, ch)

          if (that.cursorX + 1 <= width) {
            that.x += length
            that.cursorX += length
            that.program.cuf(length)
          }
        }
        else if (enter) {
          farr.splice(index, 0, ch)
          //output.log(farr)

          that.program.cub(that.cursorX-2)
          that.program.cud(1)
          that.cursorX = 0
          that.x = 0
          ++that.y
          ++that.cursorY
        }

        that.data.fake[fpos] = farr.join('')

        var tmp = []
        var flat = tmp.concat.apply(tmp, that.data.fake).join('\n')
        that.parent.setContent(flat)
        that.update(flat)
        screen.render()
      }
    }, 10)
  })

}

module.exports = Bled

Bled.prototype.update = function(s) {
  var co = this.parent._getCoords()
  this.data = this.parent._wrapContent(s, co.xl - co.xi)
}

//
// move the cursor, but only within the bounds of the array.
//
Bled.prototype.up = function() {
  if (this.y > 0) {

    var prevLineLen = this.data[this.y-1].length
    
    if (this.x > prevLineLen) {
      var diff = this.x - prevLineLen
      this.x = prevLineLen
      this.cursorX = prevLineLen+1
      this.program.cub(diff)
    }
    --this.y

    if (this.cursorY <= 1) return
    this.program.cuu(1)
    --this.cursorY
  }
}

Bled.prototype.down = function() {
  if (typeof this.data[this.y+1] != 'undefined') {

    var nextLineLen = this.data[this.y+1].length
    
    if (this.x > nextLineLen) {
      var diff = this.x - nextLineLen
      this.x = nextLineLen
      this.cursorX = nextLineLen+1
      this.program.cub(diff)
    }
    ++this.y

    var co = this.parent._getCoords()
    var height = co.yl - co.yi
    if (this.cursorY >= height) return

    this.program.cud(1)
    ++this.cursorY
  }
}

Bled.prototype.left = function() {
  if (this.x > 0) {
    --this.x
    --this.cursorX
    this.program.cub(1)
  }
}

Bled.prototype.right = function() {
  if (this.cursorX <= this.data[this.y].length) {
    ++this.x
    ++this.cursorX
    this.program.cuf(1)
  }
}
