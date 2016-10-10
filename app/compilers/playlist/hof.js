exports.match = function(type) {

  function _match(artist) {
    return (Object.keys(artist.tags || {}).includes("hof"));
  }

  return require("../../reducers/song-artist")(_match);

};
