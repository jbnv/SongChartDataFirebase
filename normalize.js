var chalk       = require("chalk"),
    firebase    = require("firebase"),
    gregoria    = require("gregoria"),
    q           = require("q"),
    util        = require("gulp-util"),
    yargs       = require('yargs'),

    fbConfig    = require("./firebase-config"),

    scoring     = require('./app/scoring');
    songTools   = require('./app/tools/song');

require('./app/polyfill');

// Initialize Firebase.
firebase.initializeApp(fbConfig.initConfig);

firebase.auth().signInWithEmailAndPassword(fbConfig.email,fbConfig.password)
.then(function() {

  var data = require('./app/data')(firebase);

  return data.getBatch({
    "songs": "songs/raw",
  })
  .then(function(snapshot) {
    var allSongs = snapshot[0].val() || {},

    db = firebase.database();

    function _write(slug,song) {
      if (!slug || !song) return;
      var ref = db.ref("songs/raw").child(slug);
      if (song.peak)
        ref.child("peak").set(song.peak);
      if (song["ascent-weeks"])
        ref.child("ascent-weeks").set(song["ascent-weeks"]);
      if (song["descent-weeks"])
        ref.child("descent-weeks").set(song["descent-weeks"]);
    }

    var scope = process.argv[2];
    if (process.argv.length > 3) {
      scope = [];
      for (var i = 2; i < process.argv.length; i++) {
        scope.push(process.argv[i]);
      }
    }

    if (typeof scope === "string") {

      // Determine filter function.
      var filterFn = function() { return false; }
      var scopePieces = scope.split(":");
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

      scope = [];
      for (var slug in allSongs) {
        if (filterFn(allSongs[slug])) scope.push(slug);
      }
    }

    if (!Array.isArray(scope)) throw "Scope is not valid.";

    var subset = scope.reduce(function(prev,cur) {
      prev[cur] = allSongs[cur]; return prev;
    }, {});

    var normalized = scoring.normalize(subset);

    for (var songSlug in normalized) {
      _write(songSlug,normalized[songSlug]);
    }

    util.log(
      "Scored",
      chalk.green(scope.length),
      "songs."
    );

  });

});
