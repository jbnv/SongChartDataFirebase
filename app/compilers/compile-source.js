var chalk       = require("chalk"),
    fs          = require("fs"),
    numeral     = require("numeral"),
    path        = require("path"),
    q           = require("q"),
    util        = require("gulp-util"),

    readEntity  = require("../../lib/fs").readEntity,

    meta        = require('../meta'),
    scoring     = require('../scoring');

// entities: array of entities of the type
module.exports = function(yargs,entities) {
  util.log(chalk.magenta("compile-source.js"));

    titles = {};
    var songs = readEntity(path.join("compiled","song","by-source"));

    entities.forEach(function(entity) {
      var slug = entity.instanceSlug;

      entity.songs = scoring.sortAndRank(songs[entity.instanceSlug]) || [];
      scoring.scoreCollection.call(entity);

      numeral.zeroFormat("");

      util.log(
        chalk.blue(entity.instanceSlug),
        entity.title,
        chalk.gray(numeral(entity.songs.length).format("0")),
        chalk.gray(numeral(entity.score || 0).format("0.00")),
        chalk.gray(numeral(entity.songAdjustedAverage || 0).format("0.00"))
      );

    });

  return {
    "all": entities,
    "titles": titles,
  }
}
