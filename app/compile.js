var firebase    = require("firebase"),
    chalk       = require("chalk"),
    util        = require("gulp-util"),
    yargs       = require('yargs');

module.exports = function(typeSlug) {

  if (!typeSlug) {
    return Firebase.Promise.reject("No type specified!");
  }

  util.log(chalk.magenta("compile.js"),typeSlug);

  // Initialize Firebase.
  var config = {
    apiKey: "AIzaSyCNApUl12tcTgebkINcUa3MiNHCYFkhjyQ",
    authDomain: "project-1638673378742311717.firebaseapp.com",
    databaseURL: "https://project-1638673378742311717.firebaseio.com",
    storageBucket: "project-1638673378742311717.appspot.com",
    messagingSenderId: "149388472792"
  };
  firebase.initializeApp(config);

  return firebase.auth().signInWithEmailAndPassword("songcharts@bienv.com", "Raichu12")

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
