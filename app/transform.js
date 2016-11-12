require("./polyfill");

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

function _sortByScore(a,b) {
  return (b.score || 0) - (a.score || 0);
}

exports.sortByScore = _sortByScore;

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

// Includes a sort and rank.
function _objectToArray(list,sortFn,options) {

  if (!list) return [];

  if (!options) options = {};

  // Convert to array.
  var outbound = [];
  for (var key in list) {
    var item = list[key];
    if (typeof item != "object") {
      item = { __value: item };
    }
    item.__key = key;
    if (!options.filterFn || options.filterFn(item)) outbound.push(item);
  }

  return outbound.sort(sortFn || _sortByScore).rank();
}

exports.objectToArray = _objectToArray;

exports.sortObject = function(list,sortFn,options) {
  var outbound = {};
  _objectToArray(list,sortFn).forEach(function(item) {
    outbound[item.__key] = item;
    delete item.__key;
  });
  return outbound;
}

function _title(v) {
  if (!v) return null;
  if (/boolean|number|string/.test(typeof mixed_var)) return v;
  // assume object
  return v.title || true;
}

// used in generating by-lists
exports.byList = function (outbound,itemSlug,collection) {
  if (!outbound) return {};
  if (!collection) return outbound;
  for (var key in collection) {
    if (!outbound[key]) outbound[key] = {};
    outbound[key][itemSlug] = _title(collection[key]);
  }
  return outbound;
}

// trueArray: { : true }
// source: {}
// transformFn: (optional) function to transform source object
exports.expand =  function(trueArray,source,transformFn) {
  if (!trueArray) return null;
  if (!source) return null;
  if (!transformFn) transformFn = function(x) { return x; };
  var outbound = {};
  for (var key in trueArray) {
    outbound[key] = transformFn(source[key]) || true;
  }
  return outbound;
}


function _aggregateEra(collection) {
  var maxCount = 1; // ensure that divisor is always greater than 0
  var maxAA = 0.01;

  for (var slug in collection) {
    var item = collection[slug];
    if (item.count > maxCount) maxCount = item.count;
    if (item.score > maxAA) maxAA = item.score;
  }

  for (var slug in collection) {
    var item = collection[slug];
    item.r = (item.score/maxAA)/(item.count/maxCount);
    item.leader = (item.r >= 1.2);
    item.lagger = (item.r <= 0.8);
  }

  return collection;

}

exports.aggregateEra = _aggregateEra;
