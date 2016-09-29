exports.match = function(song) {
  var solos = (song.artists || []).filter(function(artist) {
    return artist.roleSlug === true && ((artist.type || {}).slug == "m" || (artist.type || {}).slug == "f");
  });
  return solos.length == 2;
}
