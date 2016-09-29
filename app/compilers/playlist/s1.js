exports.match = function(song) {
  return (song.scores || []).includes(1);
}
