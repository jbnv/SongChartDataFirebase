exports.match = function() {
  var matchSlugList = Array.from(arguments);
  return function(song) {
    var outbound = false;
    for (var slug in (song.artists || {})) {
      outbound = outbound || matchSlugList.includes(slug);
    }
    return outbound;
  }
}
