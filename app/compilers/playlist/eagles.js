var matchingSlugs = [
  "eagles",
  "don-henley","glenn-frye","joe-walsh","randy-meisner","timothy-b-schmidt"
];

exports.match = function(song) {
  var outbound = false;
  (song.artists || []).forEach(function(artist) {
    outbound = outbound || matchingSlugs.includes(artist.slug);
  });
  return outbound;
}
