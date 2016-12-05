var firebase    = require("firebase"),
    chalk       = require("chalk"),
    util        = require("gulp-util"),
    fbConfig    = require("../firebase-config"),

    argv        = require("./argv")();

// fn: function that takes 'firebase' as a parameter and returns a promise.
module.exports = function(fn) {
  firebase.initializeApp(fbConfig.initConfig);
  firebase.auth().signInWithEmailAndPassword(fbConfig.email,fbConfig.password)
  .then(function() {
    if (argv.debug || argv.verbose) {
      util.log(chalk.yellow("Executing primary function."));
    }
    return fn(firebase);
  })
  .then(function() {
    util.log(chalk.yellow("DONE"));
    return true;
  })
  .catch(function (error) {
    util.log(chalk.red("UNHANDLED ERROR"), error);
    return false;
  });
};
