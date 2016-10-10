var songArtistCount = require("../../reducers/song-artist-count");

function _m(artist) {
  return (artist.roleSlug === true) && ((artist.type || {}).slug == "m");
}

function _f(artist) {
  return (artist.roleSlug === true) && ((artist.type || {}).slug == "f");
}

exports.match = function(song) {
  return songArtistCount(_m)(song) == 1 && songArtistCount(_f)(song) == 1;
}
