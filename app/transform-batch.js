var chalk       = require("chalk"),
    firebase    = require("firebase"),
    q           = require("q"),
    util        = require("gulp-util"),
    yargs       = require('yargs'),

    fbConfig    = require("../firebase-config"),

    display     = require('./display'),
    scoring     = require('./scoring'),
    songTools   = require('./tools/song'),

    argv        = require("yargs")
                    .alias('v','verbose').alias('d','debug')
                    .boolean('verbose')
                    .boolean('debug')
                    .argv;

require('./polyfill');

////////////////////////////////////////////////////////////////////////////////

function _getSubset(allSongs,median) {

  var scope = [];
  for (var i = 0; i < argv._.length; i++) {
    scope.push(argv._[i]);
  }

  if (argv.debug) {
    util.log(
      chalk.yellow("Scope"),
      scope
    );
  }

  if (scope.length == 0) throw "Empty scope!";

  if (scope.length == 1) {

    if (argv.debug) { util.log( chalk.yellow("Named scope") ); }

    // Determine filter function.
    var filterFn = function() { return true; }
    var scopePieces = scope[0].split(":");
    switch(scopePieces[0]) {
      case "artist": filterFn = songTools.hasArtist(scopePieces[1]); break;
      case "genre": filterFn = songTools.hasGenre(scopePieces[1]); break;
      case "playlist": filterFn = songTools.hasPlaylist(scopePieces[1]); break;
      case "source": filterFn = songTools.hasSource(scopePieces[1]); break;
      case "decade":
        filterFn = function(song) {
          var era = new gregoria(song.debut);
          return era.decade == scopePieces[1];
        }
        break;
      case "year":
        filterFn = function(song) {
          var era = new gregoria(song.debut);
          return era.year == scopePieces[1];
        }
        break;
    }

    if (argv.debug) { util.log(chalk.yellow("Filter function"), filterFn); }

    scope = [];
    for (var slug in allSongs) {
      if (filterFn(allSongs[slug])) scope.push(slug);
    }
  }

  if (!Array.isArray(scope)) throw "Scope is not an array!";

  var subset = scope.reduce(function(prev,cur) {
    var song =  allSongs[cur];
    if (!song.peak) song.peak = median.peak;
    if (!song["ascent-weeks"]) song["ascent-weeks"] = median["ascent-weeks"];
    if (!song["descent-weeks"]) song["descent-weeks"] = median["descent-weeks"];
    prev[cur] = song;
    return prev;
  }, {});

  if (argv.debug) {
    for (var songSlug in subset) {
      before = subset[songSlug] || {};
      util.log(
        chalk.yellow("Subset"),
        chalk.blue(songSlug),
        before.title,
        display.number(before["peak"]),
        display.number(before["ascent-weeks"]),
        display.number(before["descent-weeks"])
      );
    }
  };

  return subset;
}


////////////////////////////////////////////////////////////////////////////////

module.exports = function() {

  var transformFn =  arguments[0].transformFn;

  function _write(slug,song) {
    if (!slug || !song) return;
    var ref = firebase.database().ref("songs/raw").child(slug);
    if (song.peak)
      ref.child("peak").set(song.peak);
    if (song["ascent-weeks"])
      ref.child("ascent-weeks").set(song["ascent-weeks"]);
    if (song["descent-weeks"])
      ref.child("descent-weeks").set(song["descent-weeks"]);
  }

  if (argv.debug) {
    util.log(chalk.yellow("DEBUG"));
  }

  // Initialize Firebase.
  firebase.initializeApp(fbConfig.initConfig);

  firebase.auth().signInWithEmailAndPassword(fbConfig.email,fbConfig.password)
  .then(function() {

    return require('./data')(firebase).getBatch({
      "songs": "songs/compiled",
      "median": "summary/songs/median"
    })
    .then(function(snapshot) {
      var allSongs = snapshot[0].val() || {},
          median = snapshot[1].val() || {},

          subset = _getSubset(allSongs,median),
          transformed = transformFn(subset),
          subsetCount = Object.keys(subset).length,
          transformedCount = Object.keys(transformed).length;

      if (transformedCount < subsetCount) {
        util.log(
          chalk.blue(songSlug),
          before.title,
          chalk.red("CAUTION"),
          subsetCount - transformedCount,
          "songs not processed."
        );
      }

      for (var songSlug in transformed) {

        var before = subset[songSlug] || {};
        var after = transformed[songSlug];

        if (!after) {
          util.log(
            chalk.blue(songSlug),
            before.title,
            chalk.red("ERROR"),
            "Result is not present!"
          );
          continue;
        }

        _write(songSlug,after);

        if (argv.debug || argv.verbose) {
          util.log(
            chalk.blue(songSlug),
            before.title,
            display.number(before["peak"]),
            display.number(before["ascent-weeks"]),
            display.number(before["descent-weeks"]),
            ">",
            display.number(after["peak"]),
            display.number(after["ascent-weeks"]),
            display.number(after["descent-weeks"])
          );
        }

      } // for songSlug in transformed

      util.log(
        "Scored",
        chalk.green(transformedCount),
        "songs."
      );

    }); // get data

  }); // authorize Firebase

}; //module.exports
