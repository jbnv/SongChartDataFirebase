exports.match = function(song) {
  var outbound = false;
  (song.artists || []).forEach(function(artist) {
    outbound = outbound || (artist.roleSlug === true && artist.death);
  });
  return outbound;
}
