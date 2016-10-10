module.exports = function(predicate) {
  return function(song) {
    var count = 0;
    for (var slug in (song.artists || {})) {
      var artist = song.artists[slug];
      if (predicate(artist)) {
        count++;
      }
    }
    return count;
  }
}
