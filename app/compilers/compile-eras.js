require("../polyfill");

var _inputs = {
  "songs": "songs/compiled"
}

var _outputs = [
  ["entities", "decades"]
];

function _forDecade(era) {
  era.songs = meta.getCompiledObject("song","by-decade")()[era.slug] || [];
  scoring.scoreCollection.call(era);
  return era;
}

function _forYear(era) {
  era.songs = meta.getCompiledObject("song","by-year")()[era.slug] || [];
  scoring.scoreCollection.call(era);
  return era;
}

function _forMonth(era) {
  era.songs = meta.getCompiledObject("song","by-month")()[era.slug] || [];
  scoring.scoreCollection.call(era);
  return era;
}

function _transform(snapshot) {

  var chalk       = require("chalk"),
      util        = require("gulp-util"),

      Firehash    = require('firehash'),
      Era         = require('gregoria'),

      display     = require('../display'),
      scoring     = require('../scoring');

  util.log(chalk.magenta("compile-eras.js"));

  var allSongs = snapshot[0].val() || {},

      entities = {},

      nextYear = new Date().getFullYear() + 1,
      nextDecade = (Math.floor(nextYear/10)+1)*10,

      decades = new Firehash(), //count: 0, score: 0, songs: {}
      years = new Firehash(),
      months = new Firehash(),
      weeks = new Firehash(),
      days = new Firehash();

  // Aggregate data across songs.
  for (var songSlug in allSongs) {
    var song = allSongs[songSlug];
    if (!song.debut) continue;
    var era = new Era(song.debut);

    if (era.decade) {
      decades.push(""+era.decade+"s",songSlug,{score: song.score || 0});
    }

    if (era.year) {
      years.push(era.year,songSlug,{score: song.score || 0});
    }

    if (era.month) {
      months.push(era.slug,songSlug,{score: song.score || 0});
    }

    //TODO weeks
    //TODO days

  }

  // Write data.

  function _aggregate(firehash) {
    return firehash.map(function(slug,era) {
      var keys = Object.keys(era);
      return {
        count: keys.length,
        score: keys.map(function(key) { return era[key]; }).scoreAdjustedAverage(),
        songs: era
      }
    })
  }

  return {
    "decades": _aggregate(decades),
    "years": _aggregate(years),
    "months": _aggregate(months)
  }

}

module.exports = {
  singular: "era",
  plural: "eras",
  inputs: _inputs,
  outputs: _outputs,
  transform: _transform
}
