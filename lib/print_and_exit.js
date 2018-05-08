/*
 *
 * print_and_exit.js
 * A wrapper of print for the CLI that exits with a non-zero code
 * in case of errors
 *
 */
 var print = require('./print');

 module.exports = function printAndExit(err, val) {
  print(err, val)
  var exitCode = err == null ? 0 : 1
  process.exit(exitCode)
}
