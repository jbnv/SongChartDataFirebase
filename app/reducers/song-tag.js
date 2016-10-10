module.exports = function(predicate) {
  return function(song) {
    var outbound = false;
    for (var tag in (song.tags || {})) {
      outbound = outbound || predicate(tag);
    }
    return outbound;
  }
}
