function _match(artist) {
  return (artist.roleSlug === true) && artist.death;
}

exports.match = require("../../reducers/song-artist")(_match);
