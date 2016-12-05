var Promise     = require("firebase").Promise,
    chalk       = require("chalk"),
    util        = require("gulp-util"),

    argv        = require("./argv")();

module.exports = function(typeSlug) {

  if (!typeSlug) {
    return Promise.reject("No type specified!");
  }

  util.log(chalk.magenta("compile.js"),typeSlug);

  return function(firebase) {
    var typeModule = require("./compilers/compile-"+typeSlug);
    var data = require('./data')(firebase);

    return data.getBatch(typeModule.inputs)
    .then(typeModule.transform)
    .then(data.setBatch)
    .then(function(outputs) {
      if (!outputs) return Promise.resolve(true);
      if (!typeModule.entities) { return Promise.reject("'entities' output not specified."); };
      if (!typeModule.errors) { return Promise.reject("'errors' output not specified."); };
      util.log(
        "Compiled",
        chalk.green(Object.keys(outputs[typeModule.entities] || {}).length),
        "entities with",
        chalk.red(Object.keys(outputs[typeModule.errors] || {}).length),
        "errors."
      );
      return Promise.resolve(true);
    });
  };

};
