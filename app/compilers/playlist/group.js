var songArtistCount = require("../../reducers/song-artist-count");

function _match(artist) {
  return
    (artist.roleSlug === true)
    && (((artist.type || {}).slug || "").length == 3);
}

exports.match = function(song) {
  return songArtistCount(_match)(song) > 0;
}
