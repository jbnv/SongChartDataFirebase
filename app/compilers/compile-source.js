var chalk       = require("chalk"),
    util        = require("gulp-util");
    numeral     = require("numeral"),

    scoring     = require('../scoring');

    require("../polyfill");

var _inputs = {
  "sources": "sources/raw",
  "songsBySource": "songs/by-source"
}

var _outputs = [
  ["entities", "sources/compiled"],
  ["titles", "sources/titles"],
  ["errors", "sources/errors"]
];

function _transform(snapshot) {

  util.log(chalk.magenta("compile-source.js"));

  var sources = snapshot[0].val() || {};
  var songsBySource = snapshot[1].val() || {};

  entities = {};
  titles = {};
  errors = [];

  for (var slug in sources) {
    var entity = sources[slug];

    titles[slug] = entity.title;

    entity.songs = scoring.sortAndRank(songsBySource[slug]) || [];
    scoring.scoreCollection.call(entity);

    numeral.zeroFormat("");

    util.log(
      chalk.blue(entity.instanceSlug),
      entity.title,
      chalk.gray(numeral(entity.songs.length).format("0")),
      chalk.gray(numeral(entity.score || 0).format("0.00")),
      chalk.gray(numeral(entity.songAdjustedAverage || 0).format("0.00"))
    );

    entities[slug] = entity;

  }

  return {
    "sources/compiled": entities,
    "sources/titles": titles,
    "sources/errors": errors
  }

}

module.exports = {
  singular: "source",
  plural: "sources",
  inputs: _inputs,
  outputs: _outputs,
  transform: _transform
}
