/*
 *
 * history.js
 * all the magic needed to save and load each entry 
 * that is made in the repl.
 *
 */
var path = require('path');
var fs = require('fs');

module.exports = function setupHistory(repl, args) {
  var f = path.join(args.path, '.lev_history');

  try {
    var history = fs.readFileSync(f, 'utf8');
    var historyLines = history.split('\n');

    historyLines.forEach(function(line) {
      if (line) {
        repl.rli.history.unshift(line);
      }
    })

  } catch(ex) {}

  var s = fs.createWriteStream(f, { flags: 'a+' });

  function record(line) {
    s.write(line + '\n');
  }

  repl.rli.on('line', record);
  repl.rli.on('record', record);
};

