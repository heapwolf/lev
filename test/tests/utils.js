var utils = require('../../lib/utils')
var fs = require('fs')
var path = require('path')
module.exports = {

  'Test find' :
  function(test, next) {
    test.plan(1);
    var loc = path.join(process.env['HOME'], '.lev-test-file')
    fs.openSync(loc, 'w')     
    var val = utils.find('.lev-test-file')
    test.equals(loc, val, "The file was where is should be")    
    fs.unlinkSync(loc)
  }
}
