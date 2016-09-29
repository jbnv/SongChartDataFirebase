var matchingSlugs = [
  "osmonds",
  "donnie-osmond","marie-osmond"
];

exports.match = function(song) {
  var outbound = false;
  (song.artists || []).forEach(function(artist) {
    outbound = outbound || matchingSlugs.includes(artist.slug);
  });
  return outbound;
}
