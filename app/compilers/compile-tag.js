require("../polyfill");

var _inputs = {
  "tags": "tags/raw",
  "artists": "artists/compiled",
  "songs": "songs/compiled",
}

var _outputs = [
  ["entities", "tags/compiled"],
  ["titles", "tags/titles"],
  ["errors", "tags/errors"],
  ["forArtists", "tags/for-artists"],
  ["forLocations", "tags/for-geo"],
  ["forSongs", "tags/for-songs"]
];

function _transform(snapshot) {

  var chalk       = require("chalk"),
      util        = require("gulp-util"),

      Entity      = require('firehash'),

      display     = require('../display'),
      scoring     = require('../scoring'),
      transform   = require('../transform');

  util.log(chalk.magenta("compile-tag.js"));

  var tags = snapshot[0].val() || {},
      allArtists = snapshot[1].val() || {},
      allSongs = snapshot[2].val() || {},

      artistsByTag = new Entity(),
      songsByTag = new Entity(),

      entities = {},
      titles = {},
      errors = {},

      forArtists = {},
      forSongs = {},
      forLocations = {};

  artistsByTag.extract("tags",allArtists);
  songsByTag.extract("tags",allSongs);

  for (var slug in tags) {
    var entity = tags[slug];

    titles[slug] = entity.title || "NOT FOUND";

    entity.artists = artistsByTag.get(slug) || {};
    entity.songs = scoring.sortAndRank(songsByTag.get(slug) || {});

    scoring.scoreCollection.call(entity);

    if (entity.coverage) {
      if (entity.coverage.artist) { forArtists[slug] = entity; }
      if (entity.coverage.geo) { forLocations[slug] = entity; }
      if (entity.coverage.song) { forSongs[slug] = entity; }
    }

    util.log(
      chalk.blue(slug),
      entity.title,
      display.count(entity.songs),
      display.number(entity.songAdjustedAverage),
      display.count(entity.artists),
      display.number(entity.artistAdjustedAverage)
    );

    entities[slug] = entity;

  }

  return {
    "tags/compiled": entities,
    "tags/titles": titles,
    "tags/errors": errors,
    "tags/for-artists": forArtists,
    "tags/for-geo": forLocations,
    "tags/for-songs": forSongs,
    "summary/tags/count": Object.keys(entities).length
  }

}

module.exports = {
  singular: "tag",
  plural: "tags",
  inputs: _inputs,
  outputs: _outputs,
  transform: _transform,
  entities: "tags/compiled",
  errors: "tags/errors"
}
