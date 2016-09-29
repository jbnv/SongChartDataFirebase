var firebase    = require("firebase"),
    chalk       = require("chalk"),
    util        = require("gulp-util"),

    typeSlug = process.argv[2];

require('./app/compile')(typeSlug)
.then(function() {
  util.log("DONE");
})
.catch(function (error) {
  util.log(
    chalk.red("ERROR"),
    error
  );
});
