module.exports = function(type) {

  function _match(artist) {
    return (artist.roleSlug === true) && ((artist.type || {}).slug == type);
  }

  return function(song) {
    return require("./song-artist-count")(_match)(song) == 1;
  };

};
