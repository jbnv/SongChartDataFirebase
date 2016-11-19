var chalk       = require("chalk"),
    firebase    = require("firebase"),
    q           = require("q"),
    util        = require("gulp-util"),
    yargs       = require('yargs'),

    fbConfig    = require("./firebase-config"),

    scoring     = require('./app/scoring');

require('./app/polyfill');


function unaryWithModifier(task,fn) {
  return function(slugColonModifier) {
    var split = (""+slugColonModifier).split(":"),
        slug = split[0],
        modifier = split[1],
        entity = read(slug);
    fn(entity,modifier);
    write(slug,entity);

    util.log(
      chalk.green(task),
      chalk.blue(slug),
      entity.title
    );
  }
}


function interpolate(tuple) {

  var slugs = tuple.split(",");
  var songs = slugs.map(read);
  if (slugs.length == 1) return;

  newScores = [];

  songs.slice(1).forEach(function(song) {
    for (var i in song.scores) {
      if (newScores.length < i+1) {
        newScores.push(song.scores[i] || 0);
      } else {
        newScores[i] += song.scores[i] || 0;
      }
    }
  });

  for (var i in newScores) {
    newScores[i] = newScores[i] / (slugs.length-1);
  }

  write(slugs[0],songs[0]);

  util.log(
    chalk.green("interpolate"),
    chalk.blue(slugs[0]),
    songs[0].title
  );
}

// var clear = unary(
//   "clear",
//   function(entity) { entity.scores = []; }
// );
//
// var zero = unary(
//   "zero",
//   function(entity) { entity.scores = false; }
// );

function processArguments(flag,fn) {
  arg = yargs.argv[flag];
  if (arg) {
    if (arg.constructor === Array) {
      arg.forEach(fn);
    } else {
      fn(arg);
    }
  }
}

// Initialize Firebase.
firebase.initializeApp(fbConfig.initConfig);

firebase.auth().signInWithEmailAndPassword(fbConfig.email,fbConfig.password)
.then(function() {

  var data = require('./app/data')(firebase);

  return data.getBatch({
    "songs": "songs/raw",
    "artists": "artists/compiled"
  })
  .then(function(snapshot) {
    var songs = snapshot[0].val() || {},
        artists = snapshot[1].val() || {},

        db = firebase.database();

    function _write(slug,song) {
      if (!slug || !song) return;

      let queryRaw = db.ref("songs/raw").child(slug);
      if (song.peak)
        queryRaw.child("peak").set(song.peak);
      if (song["ascent-weeks"])
        queryRaw.child("ascent-weeks").set(song["ascent-weeks"]);
      if (song["descent-weeks"])
        queryRaw.child("descent-weeks").set(song["descent-weeks"]);

      let queryCompiled = db.ref("songs/compiled").child(slug);
      if (song.peak)
        queryCompiled.child("peak").set(song.peak);
      if (song["ascent-weeks"])
        queryCompiled.child("ascent-weeks").set(song["ascent-weeks"]);
      if (song["descent-weeks"])
        queryCompiled.child("descent-weeks").set(song["descent-weeks"]);
      queryCompiled.child("score").set(_score(song));
    }

    function _unary(task,fn) {
      return function(slug) {

        var entity = songs[slug];

        if (!entity) {
          util.log(
            chalk.green(task),
            chalk.blue(slug),
            chalk.red("ERROR"),
            "No entity for this slug."
          );
          return;
        }

        var result = fn(entity);

        if (!result) {
          util.log(
            chalk.green(task),
            chalk.blue(slug),
            entity.title,
            chalk.red("ERROR"),
            "No result returned."
          );
          return;
        }

        _write(slug,result);

        util.log(
          chalk.green(task),
          chalk.blue(slug),
          entity.title,
          chalk.gray(result["peak"]),
          chalk.gray(result["ascent-weeks"]),
          chalk.gray(result["descent-weeks"])
        );
      }
    }


    processArguments("s",

      function(pair) {

        var a = pair.split(",")[0];
        var b = pair.split(",")[1];

        var swapped = scoring.swap(songs[a],songs[b])

        _write(a,swapped[0]);
        _write(b,swapped[1]);

        util.log(
          chalk.green("swap"),
          chalk.blue(a),
          songs[a].title,
          chalk.gray(scoring.score(swapped[0]))
        );
        util.log(
          chalk.green("swap"),
          chalk.blue(b),
          songs[b].title,
          chalk.gray(scoring.score(swapped[1]))
        );
      }
    );

    // processArguments("i",interpolate);
    //
    //
    processArguments("u",_unary(
      "up",
      function(entity) {
        if (!entity) return null;
        return {peak: scoring.up(entity.peak)};
      }
    ));

    processArguments("d",_unary(
      "down",
      function(entity) {
        if (!entity) return null;
        return {peak: scoring.down(entity.peak)};
      }
    ));

    processArguments("z",_unary(
      "zero",
      function(entity) {
        return {peak: 0.001, "ascent-weeks": 0.001, "descent-weeks": 0.001};
      }
    ));

    processArguments("c",function(slug) {
      if (!slug) return;
      var ref = db.ref("songs/raw").child(slug);
      ref.child("peak").set(null);
      ref.child("ascent-weeks").set(null);
      ref.child("descent-weeks").set(null);

      util.log(
        chalk.green("clear"),
        chalk.blue(slug),
        (songs[slug] || {}).title
      );
    });

    // if (yargs.argv.all) {
    //
    //   var artistsTransformedCount = 0;
    //   var songsTransformedCount = 0;
    //
    //   util.log("Processing",songs.length ,"by",artists.length,"artists.");
    //
    //   var unscoredSongs = [];
    //   var scoredSongCount = 0;
    //   var totalScore = 0.0;
    //   var ascent = [];
    //   var totalDescentWeeks = 0.0;
    //
    //   songs.forEach(function(song) {
    //
    //     if (song.ascent && !Array.isArray(song.ascent)) return;
    //
    //     if (!song.ascent || song.ascent.length == 0) {
    //       unscoredSongs.push(song);
    //       return;
    //     }
    //
    //     for (i = 0; i < song.ascent.length; i++) {
    //       if (ascent.length < i+1) {
    //         ascent.push(song.ascent[i]);
    //       } else {
    //         ascent[i] += song.ascent[i];
    //       }
    //     }
    //
    //     scoredSongCount++;
    //     totalDescentWeeks += song["descent-weeks"];
    //
    //   });

      // Reduce ascent array to an average.
      // Truncate ascent to its
      // var peakValue = 0;
      // var peakIndex = 0;
      //
      // ascent.forEach(function(e,index) {
      //   var f = parseFloat(e) / scoredSongCount;
      //   ascent[index] = f;
      //   if (f > peakValue) { peakValue = f; peakIndex = index; }
      // });
      //
      // ascent = ascent.slice(0,peakIndex+1);
      // var descentWeeks = 1.0 * totalDescentWeeks / scoredSongCount;
      // if (descentWeeks < 1) descentWeeks = 1;
      // console.log("[231]",totalDescentWeeks,scoredSongCount);
      //
      // unscoredSongs.forEach(function(song) {
      //   rawSong = read(song.instanceSlug);
      //   rawSong.ascent = ascent;
      //   rawSong["descent-weeks"] = descentWeeks;
      //   write(song.instanceSlug,rawSong);
      //
      //   util.log(
      //     chalk.gray("-"),
      //     chalk.blue(song.instanceSlug),
      //     song.title
      //   );
      // });
      //
      // util.log(
      //   "Scored",
      //   chalk.green(songsTransformedCount),
      //   "unscored songs."
      // );

    //}
  });

});
