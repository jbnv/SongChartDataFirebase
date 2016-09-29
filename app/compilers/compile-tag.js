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
  util.log(chalk.magenta("compile-tag.js"));

  titles = {};
  forArtists = [];
  forSongs = [];
  forLocations = [];

  var artists = readEntity(path.join("compiled","artist","by-tag"));
  var songs = readEntity(path.join("compiled","song","by-tag"));

  entities.forEach(function(entity) {
    var slug = entity.instanceSlug;

    entity.artists = artists[entity.instanceSlug] || [];
    entity.songs = scoring.sortAndRank(songs[entity.instanceSlug]) || [];
    scoring.scoreCollection.call(entity);

    if (entity.coverage) {
      if (entity.coverage.artist) { forArtists.push(entity); }
      if (entity.coverage.geo) { forLocations.push(entity); }
      if (entity.coverage.song) { forSongs.push(entity); }
    }

    util.log(
      chalk.blue(entity.instanceSlug),
      entity.title,
      chalk.gray(entity.songs.length),
      chalk.gray(entity.artists.length),
      chalk.gray(entity.score || 0),
      chalk.gray(entity.songAdjustedAverage || 0),
      chalk.gray(entity.artistAdjustedAverage || 0)
    );

  });

  return {
    "all": entities,
    "for-artist": forArtists,
    "for-geo": forLocations,
    "for-song": forSongs,
    "titles": titles
  }
}
