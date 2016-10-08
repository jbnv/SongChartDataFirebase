var chalk       = require("chalk"),
    util        = require("gulp-util");
    numeral     = require("numeral"),

    scoring     = require('../scoring');

    require("../polyfill");

var _inputs = {
  "tags": "tags/raw",
  "songsByTag":"songs/by-tag",
  "artistsByTag":"artists/by-tag",
}

var _outputs = [
  ["entities", "tags/compiled"],
  ["titles", "tags/titles"],
  ["errors", "tags/errors"]
  ["forArtists", "tags/for-artists"],
  ["forLocations", "tags/for-geo"],
  ["forSongs", "tags/for-songs"]
];

function _transform(snapshot) {

  util.log(chalk.magenta("compile-tag.js"));

  var tags = snapshot[0].val() || {};
  var songsByTag = snapshot[1].val() || {};
  var artistsByTag = snapshot[2].val() || {};

  entities = {};
  titles = {};
  errors = [];
  forArtists = [];
  forSongs = [];
  forLocations = [];

  for (var slug in tags) {
    var entity = tags[slug];

    titles[slug] = entity.title;

    entity.artists = artistsByTag[slug] || [];
    entity.songs = scoring.sortAndRank(songsByTag[slug]) || [];
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

    entities[slug] = entity;

  }

}

return {
  "tags/compiled": entities,
  "tags/titles": titles,
  "tags/errors": errors,
  "tags/for-artists": forArtists,
  "tags/for-geo": forLocations,
  "tags/for-songs": forSongs
}

module.exports = {
  singular: "tag",
  plural: "tags",
  inputs: _inputs,
  outputs: _outputs,
  transform: _transform
}
