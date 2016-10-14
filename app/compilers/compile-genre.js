var _inputs = {
  "genres": "genres/raw",
  "artistsByGenre": "artists/by-genre",
  "songsByGenre": "songs/by-genre",
  "artists": "artists/compiled",
  "songs": "songs/raw"
}

var _outputs = [
  ["entities", "genres/compiled"],
  ["titles", "genres/titles"],
  ["errors", "genres/errors"]
];

function _transform(snapshot) {

  var chalk       = require("chalk"),
      util        = require("gulp-util"),

      display     = require('../display'),
      scoring     = require('../scoring'),
      transform   = require('../transform');

  util.log(chalk.magenta("compile-genre.js"));

  var genres = snapshot[0].val() || {};
  var artistsByGenre = snapshot[1].val() || {};
  var songsByGenre = snapshot[2].val() || {};
  var allArtists = snapshot[3].val() || {};
  var allSongs = snapshot[4].val() || {};

  entities = {};
  titles = {};
  errors = {};

  for (var slug in genres) {

    var entity = genres[slug];

    titles[slug] = entity.title;

    entity.artists = scoring.expandAndScore(artistsByGenre[slug],allArtists);

    entity.songs = scoring.expandAndScore(songsByGenre[slug],allSongs);

    scoring.scoreCollection.call(entity);

    util.log(
      chalk.blue(slug),
      entity.title,
      display.count(entity.songs),
      display.count(entity.artists),
      display.number(entity.songAdjustedAverage),
      display.number(entity.artistAdjustedAverage)
    );

    entities[slug] = entity;

  }

  return {
    "genres/compiled": entities,
    "genres/titles": titles,
    "genres/errors": errors
  }

}

module.exports = {
  singular: "genre",
  plural: "genres",
  inputs: _inputs,
  outputs: _outputs,
  transform: _transform,
  entities: "genres/compiled",
  errors: "genres/errors"
}
