var _inputs = {
  "genres": "genres/raw",
  "artists": "artists/compiled",
  "artists-raw": "artists/raw",
  "songs": "songs/compiled",
  "songs-raw": "songs/raw"
}

var _outputs = [
  ["entities", "genres/compiled"],
  ["titles", "genres/titles"],
  ["errors", "genres/errors"]
];

function _transform(snapshot) {

  var chalk       = require("chalk"),
      util        = require("gulp-util"),

      Entity      = require('firehash'),

      display     = require('../display'),
      scoring     = require('../scoring'),
      transform   = require('../transform');

  util.log(chalk.magenta("compile-genre.js"));

  var genres = snapshot[0].val() || {},
      allArtists = snapshot[1].val() || {},
      allArtistsRaw = snapshot[2].val() || {},
      allSongs = snapshot[3].val() || {},
      allSongsRaw = snapshot[4].val() || {},

      artistsBy = new Entity(),
      songsBy = new Entity();

  entities = {};
  titles = {};
  errors = {};

  artistsBy.extract("genres",allArtistsRaw,function(x) { return true; });
  songsBy.extract("genres",allSongsRaw,function(x) { return true; });

  for (var slug in genres) {

    var entity = genres[slug];

    titles[slug] = entity.title;

    entity.artists = {};
    for (var artistSlug in artistsBy.get(slug) || {}) {
      entity.artists[artistSlug] = allArtists[artistSlug];
    }

    entity.songs = {};
    for (var songSlug in songsBy.get(slug) || {}) {
      entity.songs[songSlug] = allSongs[songSlug];
    }
    entity.songs = scoring.sortAndRank(entity.songs);

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
    "genres/errors": errors,
    "summary/genres/count": Object.keys(entities).length
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
