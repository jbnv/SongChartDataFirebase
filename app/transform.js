// Methods for sorting, filtering and transforming data for display.
// This file should be the same between the data and the app.

function _transformTitle(t) {
  t = ("" + t).replace(/[^\w\s]/g,"").replace(/^((The )|(A )|(An ))/,"");
  return t;
}

exports.sortByTitle = function(a,b) {
  var titleA = _transformTitle((a || {}).title);
  var titleB = _transformTitle((b || {}).title);
  return titleA < titleB ? -1 : 1;
}

exports.sortByScore = function(a,b) {
  return (b.score || 0) - (a.score || 0);
}

exports.sortBySongCount = function(a,b) {
  return (b.songs || []).length - (a.songs || []).length;
}

exports.sortByArtistCount = function(a,b) {
  return (b.artists || []).length - (a.artists || []).length;
}

exports.sortBySongAdjustedAverage = function(a,b) {
  return (b.songAdjustedAverage || 0) - (a.songAdjustedAverage || 0);
}

exports.sortByArtistAdjustedAverage = function(a,b) {
  return (b.artistAdjustedAverage || 0) - (a.artistAdjustedAverage || 0);
}

exports.objectToArray = function(obj) {
  var outbound = [];
  for (var slug in obj) {
    var item = obj[slug];
    item.instanceSlug = slug;
    outbound.push(item);
  }
  return outbound;
}

exports.sortAndRank = function(list,options) {

  if (!list) return [];

  if (!options) options = {};
  if (!options.sortFn) options.sortFn = transform.sortByScore;

  var outbound = [];
  if (options.filterFn) {
    outbound = list.sort(options.sortFn);
  } else {
    outbound = list.filter(filterFn).sort(options.sortFn);
  }

  outbound.forEach(function(item,index) {
    if (!item.ranks) item.ranks = {};
    item.ranks[options.rankField] = index + 1;
  });

  return outbound;
}
