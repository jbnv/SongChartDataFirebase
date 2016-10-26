// Middleware for scoring and ranking.

require("./polyfill");
var _transform = require("./transform");

function round000(n) {
  return Math.round(parseFloat(n)*1000)/1000;
}

function _sortAndRank(list,sortFn) {
  return _transform.sortObject(list,sortFn || _transform.sortByScore);
}

exports.sortAndRank = _sortAndRank;

// Scoring criteria:
// Debut score (D): Higher score (lower number) is better.
// Peak score (P): Higher score (lower number) is better.
// Duration (M): More is better.

function _score(inbound,scoringOptions) {

  var outbound = {};

	if (!scoringOptions) { scoringOptions = {}; }

  if (!inbound.peak)  { return outbound; }
  outbound.peak = parseFloat(inbound.peak);

  var ascentWeeks = parseFloat(inbound["ascent-weeks"] || 0);
  var descentWeeks = parseFloat(inbound["descent-weeks"] || 0);
  outbound.ascentWeeks = ascentWeeks;
  outbound.descentWeeks = descentWeeks;

  outbound.score = (2/3) * outbound.peak * (ascentWeeks+descentWeeks);

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

exports.score = _score;

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

exports.bend = function(c) {
  if (c == 0) return function(x) { return x };
  if (c > 0) return function(x) {
    return (c+1)*x/(c*x+1);
  };
  return function(x) {
    return parseFloat(x)/(1-c+c*x);
  }
}

// trueArray: { : true }
// source: {}
exports.expandAndScore = function(trueArray,source) {
  var expanded = _transform.expand(trueArray,source,_score);
  return _sortAndRank(expanded);
}
