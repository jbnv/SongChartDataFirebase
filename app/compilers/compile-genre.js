var chalk       = require("chalk"),
    util        = require("gulp-util");
    numeral     = require("numeral"),

    scoring     = require('../scoring');

var _inputs = {
  "genres": "genres/raw",
  "artistsByGenre": "artists/by-genre",
  "songsByGenre": "songs/by-genre",
  "artists": "artists/compiled"
}

var _outputs = [
  ["entities", "genres/compiled"],
  ["titles", "genres/titles"],
  ["errors", "genres/errors"]
];

function _transform(snapshot) {

  util.log(chalk.magenta("compile-genre.js"));

  // var inputData = snapshot.reduce(function(s) {
  //   return s.val() || {};
  // })

  var genres = snapshot[0].val() || {};
  var artistsByGenre = snapshot[1].val() || {};
  var songsByGenre = snapshot[2].val() || {};
  var artists = snapshot[3].val() || {};

  entities = {};
  titles = {};
  errors = [];

  for (var slug in genres) {
    var entity = genres[slug];

    titles[slug] = entity.title;

    entity.artists =
      (artistsByGenre[slug] || [])
      .map(function(a) { return ""+a.instanceSlug; })
      .reduce(function(outbound,key) {
        outbound[key] = artists[key]; return outbound;
      },{});

    // entity.songs = scoring.sortAndRank(songsByGenre[entity.instanceSlug]) || [];
    // scoring.scoreCollection.call(entity);

    numeral.zeroFormat("");

    util.log(
      chalk.blue(entity.instanceSlug),
      entity.title,
      chalk.gray(numeral((entity.songs || []).length).format("0")),
      chalk.gray(numeral((entity.artists || []).length).format("0")),
      chalk.gray(numeral(entity.score || 0).format("0.00")),
      chalk.gray(numeral(entity.songAdjustedAverage || 0).format("0.00")),
      chalk.gray(numeral(entity.artistAdjustedAverage || 0).format("0.00"))
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
  transform: _transform
}
