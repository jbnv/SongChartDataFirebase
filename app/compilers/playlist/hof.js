exports.match = function(song) {
  var outbound = false;
  (song.artists || []).forEach(function(artist) {
    if (artist.roleSlug === true) {
      if ((artist.tags || []).includes("hof")) outbound = true;
    }
  });
  return outbound;
}
