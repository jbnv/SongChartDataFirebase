require("../polyfill");

var _inputs = {
  "locations": "geo/raw",
  "artists": "artists/compiled",
  "artists-raw": "artists/raw",
  "songs": "songs/compiled",
  "songs-raw": "songs/raw"
}

var _outputs = [
  ["entities", "geo/compiled"],
  ["titles", "geo/titles"],
  ["errors", "geo/errors"]
];

function _transform(snapshot) {

  var chalk       = require("chalk"),
      util        = require("gulp-util"),

      Entity      = require('firehash'),

      display     = require('../display'),
      scoring     = require('../scoring');

  util.log(chalk.magenta("compile-geo.js"));

  var locations = snapshot[0].val() || {},
      allArtists = snapshot[1].val() || {},
      allArtistsRaw = snapshot[2].val() || {},
      allSongs = snapshot[3].val() || {},
      allSongsRaw = snapshot[4].val() || {},

      artistsBy = new Entity(),
      songsByArtist = new Entity(),

      entities = {},
      titles = {},
      errors = {};

  artistsBy.extract("origin",allArtistsRaw,function(x) { return true; });
  songsByArtist.extract("artists",allSongsRaw,function(x) { return true; });

  for (var slug in locations) {
    var entity = locations[slug];

    titles[slug] = entity.title;

    entity.artists = {};
    entity.songs = {};
    for (var artistSlug in artistsBy.get(slug) || {}) {
      entity.artists[artistSlug] = allArtists[artistSlug];
      for (var songSlug in (songsByArtist.get(artistSlug) || {})) {
        entity.songs[songSlug] = allSongs[songSlug];
      }
    }

    scoring.scoreCollection.call(entity);

    util.log(
      chalk.blue(slug),
      entity.title,
      display.count(entity.artists),
      display.number(entity.artistAdjustedAverage),
      display.count(entity.songs),
      display.number(entity.songAdjustedAverage)
    );

    entities[slug] = entity;

  }

  return {
    "geo/compiled": entities,
    "geo/titles": titles,
    "geo/errors": errors,
    "summary/locations/count": Object.keys(entities).length
  }

}

module.exports = {
  singular: "location",
  plural: "locations",
  inputs: _inputs,
  outputs: _outputs,
  transform: _transform,
  entities: "geo/compiled",
  errors: "geo/errors"
}
