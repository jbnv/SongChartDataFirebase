require("../polyfill");

var _inputs = {
  "locations": "geo/raw",
  "artists": "artists/compiled"
}

var _outputs = [
  ["entities", "locations/compiled"],
  ["titles", "locations/titles"],
  ["errors", "locations/errors"]
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

      artistsByGenre = new Entity(),

      entities = {},
      titles = {},
      errors = {};

  artistsByGenre.extract("origin",allArtists);

  for (var slug in locations) {
    var entity = locations[slug];

    titles[slug] = entity.title;

    entity.artists = artistsByGenre.get(slug) || {};

    scoring.scoreCollection.call(entity);

    util.log(
      chalk.blue(slug),
      entity.title,
      display.count(entity.artists),
      display.number(entity.artistAdjustedAverage)
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
