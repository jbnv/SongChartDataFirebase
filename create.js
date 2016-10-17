var firebase    = require("firebase"),
    chalk       = require("chalk"),
    util        = require("gulp-util"),
    yargs       = require('yargs'),

    fbConfig    = require("./firebase-config");

var typeSlug = process.argv[2];
if (!typeSlug) {
  console.log("No type specified!");
  return;
}

firebase.initializeApp(fbConfig.initConfig);

firebase.auth().signInWithEmailAndPassword(fbConfig.email,fbConfig.password)

.then(function() {
  var model = require("./app/models/"+typeSlug);
  var instance = new model(yargs);
  var route = instance.typeSlugPlural+"/raw/"+instance.instanceSlug;
  firebase.database().ref(route).set(instance);

  util.log(
    chalk.green(route),
    instance
  );

  return Promise.resolve(true);
});
