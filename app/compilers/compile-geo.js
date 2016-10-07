var chalk       = require("chalk"),
    util        = require("gulp-util");
    numeral     = require("numeral"),

    scoring     = require('../scoring');

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

  util.log(chalk.magenta("compile-geo.js"));

  var locations = snapshot[0].val() || {};
  var artists = snapshot[1].val() || {};

  entities = {};
  titles = {};
  errors = [];

  util.log("Caching artists and scores...");
  var locationArtists = {};
  var locationScores = {};
  for (var artistSlug in artists) {
    var artist = artists[artistSlug];
    var slug = artist.origin;
    if (!locationArtists[slug]) { locationArtists[slug] = []; }
    if (!locationScores[slug]) { locationScores[slug] = 0.0; }
    locationArtists[slug].push(artist);
    if (artist.score) {
      try {
        locationScores[slug] += parseFloat(artist.score);
      } catch(error) {
      }
    }
  }
  util.log("Cache complete.");

  for (var slug in locations) {
    var entity = locations[slug];

    titles[slug] = entity.title;

    var entityArtists = locationArtists[slug] || [];
    entity.artists = entityArtists.toObject(
      function(o) { return o.instanceSlug; },
      function(o) { return o.title; }
    );
    entity.score = locationScores[slug] || 0;
    entity.artistAdjustedAverage = entityArtists.adjustedAverage();

    numeral.zeroFormat("");

    util.log(
      chalk.blue(entity.instanceSlug),
      entity.title,
      chalk.gray(numeral((entity.artists || []).length).format("0")),
      chalk.gray(numeral(entity.artistAdjustedAverage || 0).format("0.00"))
    );

    entities[slug] = entity;

  }

  return {
    "geo/compiled": entities,
    "geo/titles": titles,
    "geo/errors": errors
  }

}

module.exports = {
  singular: "location",
  plural: "locations",
  inputs: _inputs,
  outputs: _outputs,
  transform: _transform
}
