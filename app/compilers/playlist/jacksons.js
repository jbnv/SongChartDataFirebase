var matchingSlugs = [
  "jacksons","michael-jackson","janet-jackson",
  "jermaine-jackson","rebbie-jackson","3t"
];

exports.match = function(song) {
  var outbound = false;
  (song.artists || []).forEach(function(artist) {
    outbound = outbound || matchingSlugs.includes(artist.slug);
  });
  return outbound;
}
