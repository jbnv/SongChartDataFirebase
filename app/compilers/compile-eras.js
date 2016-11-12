require("../polyfill");
var moment = require("moment");

var _inputs = {
  "songs": "songs/raw"
}

var _outputs = [
  ["entities", "decades"]
];

function _parseSlug(slug) {
  if (!slug) return null;
  if (/^\d\d\d\d-\d\d$/.test(slug)) slug = slug + "-01";
  return moment(slug,"YYYY-MM-DD");
}

function _transform(snapshot) {

  var chalk       = require("chalk"),
      util        = require("gulp-util"),

      Firehash    = require('firehash'),
      Era         = require('gregoria'),

      display     = require('../display'),
      scoring     = require('../scoring'),
      transform   = require('../transform');

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

  const weekSeconds = 7 * 24 * 3600;

  // Aggregate data across songs.
  for (var songSlug in allSongs) {
    var song = allSongs[songSlug];
    if (!song.debut) continue;
    var era = new Era(song.debut);

    var score = scoring.score(song);

    if (era.decade) {
      decades.push(""+era.decade+"s",songSlug,{score: score || 0});
    }

    if (era.year) {

      var debutDate = _parseSlug(era.slug);
      var endDate = moment(debutDate).add(song["ascent-weeks"]+song["descent-weeks"], 'weeks');

      var debutDateUnix = debutDate.unix(); // seconds in Unix Epoch

      for (var year = moment(debutDate).startOf('year') ; year.isBefore(endDate) ; year.add(1, "year")) {
        var startWeeks = (year.unix() - debutDate.unix()) / weekSeconds;
        var endWeeks = startWeeks + ((year.isLeapYear() ? 366 : 365)/7);
        var periodScore = scoring.scoreForSpan(song,startWeeks,endWeeks);
        years.push(year.format("YYYY"),songSlug,{score: periodScore || 0});
      }

    }

    if (/^\d\d\d\d-\d\d/.test(era.slug)) {

      // Get the start and end date of the month.
      var debutDate = _parseSlug(era.slug);
      var endDate = moment(debutDate).add(song["ascent-weeks"]+song["descent-weeks"], 'weeks');

      var debutDateUnix = debutDate.unix(); // seconds in Unix Epoch

      for (var month = moment(debutDate).startOf('month') ; month.isBefore(endDate) ; month.add(1, "month")) {
        var startWeeks = (month.unix() - debutDate.unix()) / weekSeconds;
        var endWeeks = startWeeks + (month.daysInMonth()/7);
        var periodScore = scoring.scoreForSpan(song,startWeeks,endWeeks);
        months.push(month.format("YYYY-MM"),songSlug,{score: periodScore || 0});
      }

      //TODO weeks
      //TODO days

    }

  }

  // Write data.

  function _aggregate(firehash) {
    return transform.aggregateEra(firehash.map(function(slug,era) {
      var keys = Object.keys(era);
      return {
        count: keys.length,
        score: keys.map(function(key) { return era[key]; }).scoreAdjustedAverage(),
        songs: era,
        topsong: keys.reduce(function(prev,cur) {
          if (!prev) return cur;
          if (era[cur].score > era[prev].score) return cur;
          return prev;
        })
      }
    }));
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
