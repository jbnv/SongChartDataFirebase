var chalk       = require("chalk"),
    fs          = require("fs"),
    path        = require("path"),
    q           = require("q"),
    util        = require("gulp-util"),

    readEntity  = require("../../lib/fs").readEntity,

    meta        = require('../meta'),
    scoring     = require('../scoring');

// entities: array of entities of the type
module.exports = function(yargs,entities) {
  util.log(chalk.magenta("compile-artist-list.js"));

  titles = {};
  var artists = readEntity(path.join("compiled","artist","by-tag"));

  entities.forEach(function(entity) {
    var slug = entity.instanceSlug;

    entity.artists = artists[entity.instanceSlug] || [];
    scoring.scoreCollection.call(entity);

    util.log(
      chalk.blue(entity.instanceSlug),
      entity.title,
      chalk.gray(entity.artists.length),
      chalk.gray(entity.score || 0),
      chalk.gray(entity.artistAdjustedAverage || 0)
    );

  });

  return {
    "all": entities,
    "titles": titles,
  }
}
