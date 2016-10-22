require("../polyfill");

var _inputs = {
  "sources": "sources/raw",
  "songs": "songs/compiled"
}

var _outputs = [
  ["entities", "sources/compiled"],
  ["titles", "sources/titles"],
  ["errors", "sources/errors"]
];

function _transform(snapshot) {

  var chalk       = require("chalk"),
      util        = require("gulp-util"),

      Entity      = require('firehash'),

      display     = require('../display'),
      scoring     = require('../scoring'),
      transform   = require('../transform');

  util.log(chalk.magenta("compile-source.js"));

  var sources = snapshot[0].val() || {},
      allSongs = snapshot[1].val() || {},

      songsBySource = new Entity(),

      entities = {},
      titles = {},
      errors = {};

  songsBySource.extract("sources",allSongs);

  for (var slug in sources) {
    var entity = sources[slug];

    titles[slug] = entity.title;

    entity.songs = scoring.sortAndRank(songsBySource.get(slug) || {});
    scoring.scoreCollection.call(entity);

    util.log(
      chalk.blue(slug),
      entity.title,
      display.count(entity.songs),
      display.number(entity.songAdjustedAverage)
    );

    entities[slug] = entity;

  }

  return {
    "sources/compiled": entities,
    "sources/titles": titles,
    "sources/errors": errors,
    "summary/sources/count": Object.keys(entities).length
  }

}

module.exports = {
  singular: "source",
  plural: "sources",
  inputs: _inputs,
  outputs: _outputs,
  transform: _transform,
  entities: "sources/compiled",
  errors: "sources/errors"
}
