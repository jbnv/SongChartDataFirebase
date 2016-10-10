module.exports = function(predicate) {
  return function(song) {
    var outbound = false;
    for (var slug in (song.artists || {})) {
      outbound = outbound || predicate(song.artists[slug]);
    }
    return outbound;
  }
}
