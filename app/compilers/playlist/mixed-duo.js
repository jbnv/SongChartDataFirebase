exports.match = function(song) {
  var soloMales = (song.artists || []).filter(function(artist) {
    return artist.roleSlug === true && (artist.type || {}).slug == "m";
  });
  var soloFemales = (song.artists || []).filter(function(artist) {
    return artist.roleSlug === true && (artist.type || {}).slug == "f";
  });
  return soloMales.length == 1 && soloFemales.length == 1;
}
