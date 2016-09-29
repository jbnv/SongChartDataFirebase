exports.match = function(song) {
  var matches = (song.artists || []).filter(function(artist) {
    return artist.roleSlug === true
          && ((artist.type || {}).slug || "").length == 2;
  });
  return matches.length > 0;
}
