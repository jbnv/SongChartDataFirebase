exports.match = function(song) {
  if (!song.debut) return false;
  if (!song.debutEra) {
    song.debutEra = new Era(song.debut);
  }
  debutYear = song.debutEra.year || 0;
  return debutYear >= 1987 && debutYear <= 1992;
}
