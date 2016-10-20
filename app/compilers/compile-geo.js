require("../polyfill");

var _inputs = {
  "locations": "geo/raw",
  "artists": "artists/raw",
  "songs": "songs/raw",
  "artist-scores": "artists/scores",
  "song-scores": "songs/scores"
}

var _outputs = [
  ["entities", "geo/compiled"],
  ["titles", "geo/titles"],
  ["errors", "geo/errors"]
];

function _transform(snapshot) {

  var chalk       = require("chalk"),
      util        = require("gulp-util"),

      Entity      = require('../../lib/entity'),

      display     = require('../display'),
      scoring     = require('../scoring');

  util.log(chalk.magenta("compile-geo.js"));

  var locations = snapshot[0].val() || {},
      allArtists = snapshot[1].val() || {},
      allSongs = snapshot[2].val() || {},
      artistScores = snapshot[3].val() || {},
      songScores = snapshot[4].val() || {},

      artistsByLocation = new Entity(),
      songsByArtist = new Entity(),

      entities = {},
      titles = {},
      errors = {};

  artistsByLocation.extract("origin",allArtists);
  songsByArtist.extract("artist",allSongs);
  console.log(songsByArtist.export()); //TEMP

  for (var slug in locations) {
    var entity = locations[slug];

    titles[slug] = entity.title;

    entity.artists = artistsByLocation.get(slug) || {};

    entity.songs = {};
    for (var artistSlug in entity.artists) {
      entity.artists[artistSlug].score = artistScores[artistSlug] || null;
      for (var songSlug in (songsByArtist.get(artistSlug) || {})) {
        entity.songs[songSlug] = songsByArtist.get(artistSlug)[songSlug];
        entity.songs[songSlug].score = songScores[songSlug] || null;
      }
    }
  //  console.log(entity); //TEMP

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
