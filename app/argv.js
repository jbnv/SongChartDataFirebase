module.exports = function() {
  var yargs = require('yargs');
  if (arguments.length == 0) {
    // Default behavior.
    yargs = yargs
    .alias('v','verbose').alias('d','debug')
    .boolean('verbose')
    .boolean('debug');
  } else {
    // Assume first argument is a transformation function.
    yargs = argument[0](yargs);
  }
  return yargs.argv;
}
