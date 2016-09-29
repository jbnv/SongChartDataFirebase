var chalk       = require("chalk"),
    fs          = require("graceful-fs"),
    git         = require('gulp-git'),
    path        = require("path"),
    q           = require("q"),
    util        = require("gulp-util"),
    yargs       = require('yargs'),

    writeEntity = require("../lib/fs").writeEntity,

    meta        = require('../app/meta');

module.exports = function(gulp,model) {

  var spec = new model();

  gulp.task("create-"+spec.typeSlug, "Create a new "+spec.typeNoun+" entity.", function() {
    var instance = new model(yargs);
    var route = meta.rawRoute(spec.typeSlug,instance.instanceSlug);
    writeEntity(route,instance);
    util.log(chalk.green(route),instance);
  }, {
    options: spec.parameters
  });

  gulp.task("edit-"+spec.typeSlug, "Edit an existing "+spec.typeNoun+" entity.", function() {
    //TODO
    // var instance = new model(yargs);
    // var destinationDirectory = path.join(meta.rawRoot,spec.typeSlug);
    // create(instance.instanceSlug,destinationDirectory,instance);
    // util.log(instance.instanceSlug,instance);
  }, {
    options: spec.parameters
  });

  gulp.task(spec.typeSlug, "Show details for an existing "+spec.typeNoun+" entity.", function() {
    //TODO
    // var instance = new model(yargs);
    // var destinationDirectory = path.join(meta.rawRoot,spec.typeSlug);
    // create(instance.instanceSlug,destinationDirectory,instance);
    // util.log(instance.instanceSlug,instance);
  });

  var readdir = function(dir) {
    var deferred = q.defer();
    fs.readdir(dir, function (err, data) {
      if (err) {deferred.reject(err)}
      else { deferred.resolve(data) }
    });
    return deferred.promise;
  };

  function readFile(dir) {
    return function(filename) {
      var deferred = q.defer();
      fs.readFile(path.join(dir,filename), 'utf-8', function (err, data) {
        if (err) {deferred.reject(err)}
        else { deferred.resolve(data) }
      });
      return deferred.promise;
    };
  };

  function parse(json) {
    var outbound = {};
    try {
      outbound = JSON.parse(json);
    } catch(err) {
      util.log(chalk.red(err.message),json);
    }
    return outbound;
  }

  gulp.task("compile-"+spec.typeSlug, "Compile "+spec.typeNoun+" entities.", function() {

    var source_directory = path.join(meta.rawRoot,spec.typeSlug);
    var destination_directory = path.join(meta.compiledRoot,spec.typeSlug);
    util.log("compile-"+spec.typeSlug+": /raw/"+spec.typeSlug+" -> /compiled/"+spec.typeSlug);

    readdir(source_directory)
    .then(function (filenames) {
      util.log("Read "+filenames.length+" files.");
      var promises = filenames.map(readFile(source_directory));
      return q.all(promises);
    })
    .then(function(entityFileTexts) {
      var entities = entityFileTexts.map(parse);
      var compiled_content_as_object = require("../app/compilers/compile-"+spec.typeSlug)(null,entities);

      for (var key in compiled_content_as_object) {
        if (key == "error") continue;
        var route = meta.compiledRoute(spec.typeSlug,key);
        var content = compiled_content_as_object[key];
        writeEntity(route,content);
        util.log(chalk.green(route));
      }

      if (compiled_content_as_object.all) {
        var count = 0;
        util.log("Processing "+chalk.green(compiled_content_as_object.all.length)+" entities.");
        compiled_content_as_object.all.forEach(function(e) {
          if (!e.instanceSlug) {
            util.log(e.title+" "+chalk.red("No instanceSlug! Skipped."));
            return;
          }
          var route = meta.compiledRoute(spec.typeSlug,e.instanceSlug);
          writeEntity(route,e);
          count++;
        });
        util.log("Compiled "+chalk.green(count)+" entities.");
      }

      (compiled_content_as_object.errors || []).forEach(function(error) {
        util.log(
          chalk.magenta(error.typeSlug),
          chalk.blue(error.instanceSlug),
          error.error
        );
      });

    })
    .catch(function (error) {
      util.log("ERROR:",error);
    })
  });

  gulp.task("commit-"+spec.typeSlug, "Commit "+spec.typeNoun+" entities to Git.", function() {
    var message = yargs.argv.m || "Updates of "+spec.typeNoun+" entities.";
    return gulp
      .src(["./raw/"+spec.typeSlug,"./compiled/"+spec.typeSlug])
      .pipe(git.add())
      .pipe(git.commit(message));
  });

  gulp.task("commit-raw-"+spec.typeSlug, "Commit raw "+spec.typeNoun+" entities to Git.", function() {
    var message = yargs.argv.m || "Updates of raw "+spec.typeNoun+" entities.";
    return gulp
      .src(["./raw/"+spec.typeSlug])
      .pipe(git.add())
      .pipe(git.commit(message));
  });

};
