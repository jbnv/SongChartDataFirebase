var chalk       = require("chalk"),
    Promise     = require("firebase").Promise,
    util        = require("gulp-util"),
    yargs       = require('yargs');

var typeSlug = process.argv[2];
if (!typeSlug) {
  console.log("No type specified!");
  return;
}

require('./app/firebase-app')(function(firebase) {
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
