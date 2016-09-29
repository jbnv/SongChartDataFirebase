exports.match = function(song) {
  return song.source && song.source.type == "tv";
}
