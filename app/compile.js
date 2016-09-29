var firebase    = require("firebase"),
    chalk       = require("chalk"),
    util        = require("gulp-util"),
    yargs       = require('yargs'),
    fbConfig    = require("../firebase-config");

module.exports = function(typeSlug) {

  if (!typeSlug) {
    return Firebase.Promise.reject("No type specified!");
  }

  util.log(chalk.magenta("compile.js"),typeSlug);

  // Initialize Firebase.
  firebase.initializeApp(fbConfig.initConfig);

  return firebase.auth().signInWithEmailAndPassword(fbConfig.email,fbConfig.password)

  .then(function() {
     return require("./compilers/compile-"+typeSlug)(yargs)
     .then(function(results) {
       util.log("Compiled",chalk.green(results.entityCount),"entities with",chalk.red(results.errorCount),"errors.");
       return Promise.resolve(true);
     })
  })
  .then(function() {
    util.log("compile.js DONE");
    return Promise.resolve(true);
  });
};
