require("../polyfill");

var _inputs = {
  "playlists": "playlists/raw",
  "songs":"songs/compiled"
}

var _outputs = [
  ["entities", "playlists/compiled"],
  ["titles", "playlists/titles"],
  ["errors", "playlists/errors"]
];

function _transform(snapshot) {

  var chalk       = require("chalk"),
      util        = require("gulp-util"),

      Entity      = require('firehash'),

      display     = require('../display'),
      scoring     = require('../scoring'),
      transform   = require('../transform'),

      argv        = require("yargs").argv;

  util.log(chalk.magenta("compile-playlist.js"));

  var playlists = snapshot[0].val() || {},
      allSongs = snapshot[1].val() || {},

      entities = {},
      titles = {},
      errors = {};

  for (var slug in playlists) {
    var entity = playlists[slug];

    titles[slug] = entity.title;
    entity.songs = {};

    // Check to see if there is a filter (entity.filter).
    // If so, use it. If not, look for the word in the song's "playlists" value.
    var filter = function(song) {
      if (song.playlists && song.playlists[slug]) {
        entity.songs[song.__slug] = song;
      }
    };

    if (entity["use-custom-filter"]) {
      var matchFn = require("./playlist/"+slug).match;
      filter = function(song) {
        if (matchFn(song)) { entity.songs[song.__slug] = song; }
      };
    }

    if (entity.filter) {
      // Check the keys on the filter object to determine what we are doing with it.
      // For now, assume that the object has only one key.
      for (var key in entity.filter) {
        var pattern = entity.filter[key];
        var exp = new RegExp(pattern);

        if (key === "title") {
          // Title: Argument is a pattern to match.
          //util.log("Title pattern:",chalk.magenta(pattern));
          filter = function(song) {
            if (exp.test(song.title)) { entity.songs[song.__slug] = song; }
          }
        }

        if (key === "tag") {
          // Tag: Argument is a pattern to match.
          //util.log("Tag pattern:",chalk.magenta(pattern));
          test = function(x) { return exp.test(x); }
          filter = function(song) {
            if ((song.tags || []).any(test)) {
              entity.songs[song.__slug] = song;
            }
          }
        }
      }
    }

    for (var songSlug in allSongs) {
      var song = allSongs[songSlug];
      song.__slug = songSlug;
      filter(song);
    }
    entity.songs = scoring.sortAndRank(entity.songs);
    scoring.scoreCollection.call(entity);

    if (argv.v || argv.verbose) {
      util.log(
        chalk.blue(slug),
        entity.title,
        display.count(entity.songs),
        display.number(entity.songAdjustedAverage)
      );
    }

    entities[slug] = entity;

  }

  return {
    "playlists/compiled": entities,
    "playlists/titles": titles,
    "playlists/errors": errors,
    "summary/playlists/count": Object.keys(entities).length
  }

}

module.exports = {
  singular: "playlist",
  plural: "playlists",
  inputs: _inputs,
  outputs: _outputs,
  transform: _transform,
  entities: "playlists/compiled",
  errors: "playlists/errors"
}
