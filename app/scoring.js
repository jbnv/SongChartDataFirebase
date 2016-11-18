// Middleware for scoring and ranking.

require("./polyfill");
var _transform = require("./transform");

function _sortAndRank(list,sortFn) {
  return _transform.sortObject(list,sortFn || _transform.sortByScore);
}

exports.sortAndRank = _sortAndRank;

function _score() {

  var peak = arguments[0] || 0,
      ascentWeeks = arguments[1] || 0,
      descentWeeks = arguments[2] || 0;

  if (typeof arguments[0] == "object") {
    peak = arguments[0].peak || 0;
    ascentWeeks = arguments[0]["ascent-weeks"] || 0;
    descentWeeks = arguments[0]["descent-weeks"] || 0;
  }

  return (2/3) * peak * (ascentWeeks+descentWeeks);
}

function _cumulativeScale(weeks,ascentWeeks,descentWeeks) {

  if (weeks <= 0) { return 0; }

  if (weeks < ascentWeeks) {
    return Math.pow(weeks,2)/ascentWeeks - Math.pow(weeks,3)/Math.pow(ascentWeeks,2)/3 ;
  }
  if (weeks < ascentWeeks+descentWeeks) {
    return (2/3) * ascentWeeks + (weeks-ascentWeeks) - Math.pow(weeks-ascentWeeks,3)/3/descentWeeks/descentWeeks
  }
  return (2/3) * (ascentWeeks+descentWeeks);
}

function _scoreForSpan() {

  if (arguments.length < 1) return 0;

  var song = arguments[0],
      startWeek = arguments[1] || 0,
      endWeek = arguments[2] || 0;

  var ascentWeeks = song["ascent-weeks"] || 0,
      descentWeeks = song["descent-weeks"] || 0;

  return song.peak * (_cumulativeScale(endWeek,ascentWeeks,descentWeeks) - _cumulativeScale(startWeek,ascentWeeks,descentWeeks));
}

exports.score = _score;
exports.scoreForSpan = _scoreForSpan;

exports.cumulativeScore = function() {

  var song = arguments[0], week = arguments[1];

  if (!song || !week) return 0;

  return song.peak * _cumulativeScale(week,song["ascent-weeks"],song["descent-weeks"]);

}

function _scoreSum(songs) {
  if (Array.isArray(songs)) {
    return songs.reduce(function(sum,song) { return sum+_score(song); }, 0);
  }
  return Object.keys(songs).reduce(function(sum,key) { return sum+_score(songs[key]); }, 0);
}

exports.scoreSum = _scoreSum;

function _scoreSong(inbound,scoringOptions) {

  var outbound = {};

	if (!scoringOptions) { scoringOptions = {}; }

  if (!inbound.peak)  { return outbound; }
  outbound.peak = parseFloat(inbound.peak);

  var ascentWeeks = parseFloat(inbound["ascent-weeks"] || 0);
  var descentWeeks = parseFloat(inbound["descent-weeks"] || 0);
  outbound.ascentWeeks = ascentWeeks;
  outbound.descentWeeks = descentWeeks;

  outbound.score = _score(outbound.peak,ascentWeeks,descentWeeks)

	outbound.duration = Math.ceil(
    (ascentWeeks+descentWeeks) * 7 / 30.4375
  );

  if (scoringOptions.includeDenominator) {
    outbound.denominator = function(w) {
      return w < ascentWeeks ? ascentWeeks : descentWeeks;
    }
  }

  // w0, w1: start week, end week
  if (scoringOptions.includeScoreFn) {
    outbound.scoreFn = function(w0,w1) {
      var a1 = Math.pow(w1-ascentWeeks,3)/this.denominator(w1)/this.denominator(w1)/3;
      var a0 = Math.pow(w0-ascentWeeks,3)/this.denominator(w0)/this.denominator(w0)/3;
      return this.peak * (w1 - w0 - a1 + a0);
    }
  }

	return outbound;
}

exports.scoreSong = _scoreSong;

// this: song collection
exports.scoreCollection = function() {

  function _properties(collection) {
    if (collection) {
      var collectionArray =
        Array.isArray(collection)
        ? collection
        : Object.keys(collection).map(function(key) { return collection[key]; });
      return {
        count: collectionArray.length,
        average: collectionArray.scoreAdjustedAverage()
      };
    }
  }

  if (this.songs) {
    var songProperties = _properties(this.songs);
    this.songCount = songProperties.count;
    this.songAdjustedAverage = songProperties.average;
  }

  if (this.artists) {
    var artistProperties = _properties(this.artists);
    this.artistCount = artistProperties.count;
    this.artistAdjustedAverage = artistProperties.average;
  }

}

exports.aggregateCollection = function() {
  var that = this;
  this.maxSongCount = 0.00;
  this.maxSongAdjustedAverage = 0.00;
  this.maxArtistCount = 0.00;
  this.maxArtistAdjustedAverage = 0.00;

  this.forEach(function(item) {
    if (item.songCount > that.maxSongCount) {
      that.maxSongCount = item.songCount;
    }
    if (item.songAdjustedAverage > that.maxSongAdjustedAverage) {
      that.maxSongAdjustedAverage = item.songAdjustedAverage;
    }
    if (item.artistCount > that.maxArtistCount) {
      that.maxArtistCount = item.artistCount;
    }
    if (item.artistAdjustedAverage > that.maxArtistAdjustedAverage) {
      that.maxArtistAdjustedAverage = item.artistAdjustedAverage;
    }
  });

  // Calculate fractions.
  if (this.maxSongCount) {
    this.forEach(function(item) {
      item.songCountScale = 1.0*item.songCount / that.maxSongCount;
    });
  }
  if (this.maxSongAdjustedAverage) {
    this.forEach(function(item) {
      item.songAdjustedAverageScale = 1.0*item.songAdjustedAverage / that.maxSongAdjustedAverage;
    });
  }
  if (this.maxArtistCount) {
    this.forEach(function(item) {
      item.artistCountScale = 1.0*item.artistCount / that.maxArtistCount;
    });
  }
  if (this.maxArtistAdjustedAverage) {
    this.forEach(function(item) {
      item.artistAdjustedAverageScale = 1.0*item.artistAdjustedAverage / that.maxArtistAdjustedAverage;
    });
  }

}

// Rank an entity list over a membership collection.
// For use after the list has been processed.
// entities: True-array of entities to rank.
// memberships.
// prefix: A prefix to add to the slug to make the ranking slug.
exports.rankEntities = function(entities,memberships,prefix) {
  if (!memberships) {
    // Rank the entire set.
    var members = _sortAndRank(entities);
    for (var key in members) {
      var entity = members[key];
      if (entity) {
        if (!entity.ranks) entity.ranks = {};
        entity.ranks.overall = {
          "title":"Overall",
          "rank":entity.__rank,
          "total":entity.__rankCount
        };
      }
    }
    return;
  }

  for (var membershipKey in memberships) {
    // Transform membership keys.
    var members = {};
    for (var memberKey in memberships[membershipKey]) {
      members[memberKey] = entities[memberKey];
    }
    var members = _sortAndRank(members);
    for (var memberKey in members) {
      var member = members[memberKey];
      var entity = entities[memberKey];
      if (entity) {
        if (!entity.ranks) entity.ranks = {};
        entity.ranks[prefix+":"+membershipKey] = {
          "title":memberships[membershipKey].title || "UNKNOWN", //TODO
          "rank":member.__rank,
          "total":member.__rankCount
        };
      }
    }
  }
}

function _bend(c) {
  if (c == 0) return function(x) { return x };
  if (c > 0) return function(x) {
    return (c+1)*x/(c*x+1);
  };
  return function(x) {
    return parseFloat(x)/(1-c+c*x);
  }
}

exports.bend = _bend;
exports.up = _bend(1);
exports.down = _bend(-1);

// trueArray: { : true }
// source: {}
exports.expandAndScore = function(trueArray,source) {
  var expanded = _transform.expand(trueArray,source,_scoreSong);
  return _sortAndRank(expanded);
}

exports.scoreFactor = function(role) {
  switch (role) {
    case true: return 1.00;
    case "feature": return 0.20;
    case "lead": return 0.75;
    case "backup": return 0.10;
    case "writer": return 1.00;
    case "producer": return 0.50;
    case "sample": return 0.1;
    case "remake": return 0.1;
    case "remix": return 0.25;
  }
  return 0.233; // an odd number to make it clear that the role wasn't found.
}

function _adjustDescent(song,newScore) {
  song["descent-weeks"] = 1.5 * newScore / song.peak - song["ascent-weeks"];
}

function _swap() {

  function _clone(obj) {
    return {
      peak: obj.peak,
      "ascent-weeks": obj["ascent-weeks"],
      "descent-weeks": obj["descent-weeks"]
    }
  }

  var entityA = _clone(arguments[0]);
  var entityB = _clone(arguments[1]);

  // Strategy: Keep the peaks and ascent; scale the descents to swap the scores.

  var ascentA = entityA["ascent-weeks"] || 0;
  var ascentB = entityB["ascent-weeks"] || 0;

  var descentA = entityA["descent-weeks"] || 0;
  var descentB = entityB["descent-weeks"] || 0;

  var scoreA = entityA.peak * (ascentA + descentA);
  var scoreB = entityB.peak * (ascentB + descentB);

  entityA["descent-weeks"] = scoreB / entityA.peak - ascentA;
  entityB["descent-weeks"] = scoreA / entityB.peak - ascentB;

  if (entityA["descent-weeks"] < 1)  entityA["descent-weeks"] = 1;
  if (entityB["descent-weeks"] < 1)  entityB["descent-weeks"] = 1;

  return [entityA,entityB];
}

exports.swap = _swap;

function _distribute(songObject) {

  var songCount = Object.keys(songObject).length;
  var songArray = [];

  // Determine the number of objects and the total score.
  var totalScore = 0;
  for (var slug in songObject) {
    var song = songObject[slug];
    songArray.push({
      "slug": slug,
      "peak": song.peak,
      "ascent-weeks": song["ascent-weeks"],
      "descent-weeks": song["descent-weeks"],
      "score":_score(song)
    });
    totalScore += _score(song);
  }

  // Order by score ascending to use index in factor.
  songArray.sort(function(a,b) { return a.score - b.score; });

  // Average and apply the average to each score.
  var factor = totalScore / Math.pow(songCount,2);

  var outbound = {};
  songArray.forEach(function(song,index) {
    var newScore = factor * (2*index+1);
    _adjustDescent(song,newScore);
    song.score = _score(song);
    outbound[song.slug] = song;
  });

  return outbound;

}

exports.distribute = _distribute;
