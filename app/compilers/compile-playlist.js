var chalk       = require("chalk"),
    util        = require("gulp-util");
    numeral     = require("numeral"),

    scoring     = require('../scoring');

    require("../polyfill");

var _inputs = {
  "playlists": "playlists/raw",
  "songs":"songs/compiled",
  "songsByPlaylist": "songs/by-playlist"
}

var _outputs = [
  ["entities", "playlists/compiled"],
  ["titles", "playlists/titles"],
  ["errors", "playlists/errors"]
];

function _transform(snapshot) {

  util.log(chalk.magenta("compile-playlist.js"));

  var playlists = snapshot[0].val() || {};
  var songs = snapshot[1].val() || {};
  var songsByPlaylist = snapshot[2].val() || {};

  entities = {};
  titles = {};
  errors = [];

  for (var slug in playlists) {
    var entity = playlists[slug];

    titles[slug] = entity.title;
    entity.songs = scoring.sortAndRank(songs[entity.instanceSlug]) || [];

    // Check to see if there is a filter (entity.filter).
    // If so, use it. If not, look for the word in the song's "playlists" value.
    var filter = function(song) {
      if (song.playlists) {
        song.playlists.forEach(function(songPlaylistSlug) {
          if (songPlaylistSlug === slug) {
            entity.songs.push(song);
          }
        });
      }
    };

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
            if (exp.test(song.title)) { entity.songs.push(song); }
          }
        }

        if (key === "tag") {
          // Tag: Argument is a pattern to match.
          //util.log("Tag pattern:",chalk.magenta(pattern));
          test = function(x) { return exp.test(x); }
          filter = function(song) {
            if ((song.tags || []).any(test)) {
              entity.songs.push(song);
            }
          }
        }
      }
    }

    for (var songSlug in songs) {
      filter(songs[songSlug]);
    }
    entity.songs = scoring.sortAndRank(entity.songs);
    scoring.scoreCollection.call(entity);

    numeral.zeroFormat("");

    util.log(
      chalk.blue(entity.instanceSlug),
      entity.title,
      chalk.gray(numeral(entity.songs.length).format("0")),
      chalk.gray(numeral(entity.score || 0).format("0.00")),
      chalk.gray(numeral(entity.songAdjustedAverage || 0).format("0.00"))
    );

    entities[slug] = entity;

  }

  return {
    "playlists/compiled": entities,
    "playlists/titles": titles,
    "playlists/errors": errors
  }

}

module.exports = {
  singular: "playlist",
  plural: "playlists",
  inputs: _inputs,
  outputs: _outputs,
  transform: _transform
}
