var firebase    = require("firebase"),
    chalk       = require("chalk"),
    util        = require("gulp-util"),
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
    .then(data.setBatch)
    .then(function(outputs) {
      if (!outputs) outputs = {};
      if (!typeModule.entities) {
        util.log(
          chalk.red("ERROR"),
          "'entities' output not specified."
        );
      }
      if (!typeModule.errors) {
        util.log(
          chalk.red("ERROR"),
          "'errors' output not specified."
        );
      }
      util.log(
        "Compiled",
        chalk.green(Object.keys(outputs[typeModule.entities] || {}).length),
        "entities with",
        chalk.red(Object.keys(outputs[typeModule.errors] || {}).length),
        "errors."
      );
      return Promise.resolve(true);
    });
  });

};
