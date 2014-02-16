var blessed = require('blessed')

function Loading(screen) {

  this.screen = screen

  this.loading = blessed.box({
    parent: this.screen,
    hidden: true,
    top: 'center',
    left: 'center',
    width: 'half',
    height: 4,
    border: {
      type: 'ascii'
    },
    tags: true,
    align: 'center'
  })

  this.loading._.icon = blessed.text({
    parent: loading,
    align: 'center',
    top: 2,
    left: 1,
    right: 1,
    height: 1,
    content: '|'
  })
}

module.exports = Loading

Loading.prototype.load = function(text) {

  this.loading.show();
  this.loading.setContent(text);
  if (this.loading._.timer) {
    this.loading._.stop();
  }
  this.screen.lockKeys = true;
  var that = this
  this.loading._.timer = setInterval(function() {
    if (that.loading._.icon.content === '|') {
      that.loading._.icon.setContent('/');
    } else if (that.loading._.icon.content === '/') {
      that.loading._.icon.setContent('-');
    } else if (that.loading._.icon.content === '-') {
      that.loading._.icon.setContent('\\');
    } else if (that.loading._.icon.content === '\\') {
      that.loading._.icon.setContent('|');
    }
    that.screen.render();
  }, 200);
}

Loading.prototype.stop = function() {
  this.screen.lockKeys = false;
  this.loading.hide();
  if (this.loading._.timer) {
    clearInterval(this.loading._.timer);
    delete this.loading._.timer;
  }
  this.screen.render();
}
