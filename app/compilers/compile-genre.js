var firebase    = require("firebase"),
    chalk       = require("chalk"),
    util        = require("gulp-util");
    numeral     = require("numeral"),

    // meta        = require('../meta'),
    scoring     = require('../scoring');

// entities: array of entities of the type
module.exports = function() {
  util.log(chalk.magenta("compile-genre.js"));

  var db = firebase.database();

  return firebase.Promise.all([
    db.ref("genres/raw").once('value'),
    db.ref("artists/by-genre").once('value'),
    db.ref("songs/by-genre").once('value'),
    db.ref("artists/compiled").once('value')
  ])

  .then(function(snapshot) {

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

      // numeral.zeroFormat("");
      //
      // util.log(
      //   chalk.blue(entity.instanceSlug),
      //   entity.title,
      //   chalk.gray(numeral(entity.songs.length).format("0")),
      //   chalk.gray(numeral(entity.artists.length).format("0")),
      //   chalk.gray(numeral(entity.score || 0).format("0.00")),
      //   chalk.gray(numeral(entity.songAdjustedAverage || 0).format("0.00")),
      //   chalk.gray(numeral(entity.artistAdjustedAverage || 0).format("0.00"))
      // );
      //
      entities[slug] = entity;

    }

    db.ref("genres/compiled").set(entities);
    db.ref("genres/titles").set(titles);
    db.ref("genres/errors").set(errors);

    return {
      entityCount: Object.keys(entities).length,
      errorCount: errors.length
    };

  });
};
