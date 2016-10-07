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
    var typeModule = require("./compilers/compile-"+typeSlug);
    var data = require('./data')(firebase);

    return data.getBatch(typeModule.inputs)
    .then(typeModule.transform)
    .then(function(outputs) {

      data.setBatch(outputs);

      var entityCount = Object.keys(entities).length;
      var errorCount = errors.length;

      util.log("Compiled",chalk.green(entityCount),"entities with",chalk.red(errorCount),"errors.");
      return Promise.resolve(true);

    })
  })
  .then(function() {
    util.log("compile.js DONE");
    return Promise.resolve(true);
  });
};
