require("../polyfill");
var moment = require("moment");

var _inputs = {
  "songs": "songs/raw"
}

var _outputs = [
  ["entities", "decades"]
];

function _parseSlug(slug) {
  if (!slug || /^\d\d\d0s$/.test(slug) || /^\d\d\d\d$/.test(slug)) return null;
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
  const noop = function() {};

  // Aggregate data across songs.
  for (var songSlug in allSongs) {
    var song = allSongs[songSlug];
    if (!song.debut) continue;
    var era = new Era(song.debut);

    var score = scoring.score(song);
    var debutDate = _parseSlug(song.debut);
    var endDate = moment(debutDate).add(song["ascent-weeks"]+song["descent-weeks"], 'weeks');
    var peakMoment = moment(debutDate).add(song["ascent-weeks"], 'weeks');

    if (era.decade) {
      decades.push(""+era.decade+"s",songSlug,{score: score || 0});
    }

    if (era.year) {

      for (var year = moment(debutDate).startOf('year') ; year.isBefore(endDate) ; year.add(1, "year")) {
        var startWeeks = (year.unix() - debutDate.unix()) / weekSeconds;
        var endWeeks = startWeeks + ((year.isLeapYear() ? 366 : 365)/7);
        var periodScore = scoring.scoreForSpan(song,startWeeks,endWeeks);
        years.push(year.format("YYYY"),songSlug,{score: periodScore || 0});
      }

    }

    if (/^\d\d\d\d-\d\d/.test(era.slug)) {

      for (var month = moment(debutDate).startOf('month') ; month.isBefore(endDate) ; month.add(1, "month")) {
        var monthEnd = moment(month).endOf('month');

        var startWeeks = (month.unix() - debutDate.unix()) / weekSeconds;
        var endWeeks = startWeeks + (month.daysInMonth()/7);
        var periodScore = scoring.scoreForSpan(song,startWeeks,endWeeks);

        var outbound = {
          // debut: debutDate.format("YYYY-MM-DD"),
          // peak: peakMoment.format("YYYY-MM-DD"),
          score: periodScore || 0
        };

        outbound.isDebut = debutDate.isBetween(month,monthEnd,'day','[]'); // inclusive
        outbound.isAscending = peakMoment.isAfter(monthEnd);
        outbound.isDescending = peakMoment.isBefore(month);

        months.push(month.format("YYYY-MM"),songSlug,outbound);
      }

      for (var day = moment(debutDate), weeks = 0 ; day.isBefore(endDate) ; day.add(1, "day"), weeks += 0.142857142857) {
        var periodScore = scoring.scoreForSpan(song,weeks,weeks + 0.142857142857);


        var outbound = {
          // debut: debutDate.format("YYYY-MM-DD"),
          // peak: peakMoment.format("YYYY-MM-DD"),
          score: periodScore || 0
        };

        outbound.isDebut = day.isSame(debutDate);
        outbound.isAscending = day.isBefore(peakMoment);
        outbound.isDescending = day.isAfter(peakMoment);

        days.push(day.format("YYYY-MM-DD"),songSlug,outbound);
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
    "months": _aggregate(months),
    "days": _aggregate(days)
  }

}

module.exports = {
  singular: "era",
  plural: "eras",
  inputs: _inputs,
  outputs: _outputs,
  transform: _transform
}
