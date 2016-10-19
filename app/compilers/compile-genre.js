var _inputs = {
  "genres": "genres/raw",
  "artists": "artists/compiled",
  "songs": "songs/compiled"
}

var _outputs = [
  ["entities", "genres/compiled"],
  ["titles", "genres/titles"],
  ["errors", "genres/errors"]
];

function _transform(snapshot) {

  var chalk       = require("chalk"),
      util        = require("gulp-util"),

      Entity      = require('../../lib/entity'),

      display     = require('../display'),
      scoring     = require('../scoring'),
      transform   = require('../transform');

  util.log(chalk.magenta("compile-genre.js"));

  var genres = snapshot[0].val() || {},
      allArtists = snapshot[1].val() || {},
      allSongs = snapshot[2].val() || {},

      artistsByGenre = new Entity(),
      songsByGenre = new Entity();

  entities = {};
  titles = {};
  errors = {};

  artistsByGenre.extract("genres",allArtists);
  songsByGenre.extract("genres",allSongs);

  for (var slug in genres) {

    var entity = genres[slug];

    titles[slug] = entity.title;

    entity.artists = artistsByGenre.get(slug) || {};
    entity.songs = scoring.sortAndRank(songsByGenre.get(slug) || {});

    scoring.scoreCollection.call(entity);

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
