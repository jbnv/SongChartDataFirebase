exports.match = function(song) {
  var matches = (song.artists || []).filter(function(artist) {
    return artist.roleSlug === true && (artist.type || {}).slug == "f";
  });
  return matches.length == 1;
}
