var matchingSlugs = ["bee-gees","barry-gibb","robin-gibb","maurice-gibb","andy-gibb"];

exports.match = function(song) {
  var outbound = false;
  (song.artists || []).forEach(function(artist) {
    outbound = outbound || matchingSlugs.includes(artist.slug);
  });
  return outbound;
}
