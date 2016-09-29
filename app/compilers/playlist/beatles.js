var matchingSlugs = ["beatles","paul-mccartney","john-lennon","george-harrison","ringo-starr"];

exports.match = function(song) {
  var outbound = false;
  (song.artists || []).forEach(function(artist) {
    outbound = outbound || matchingSlugs.includes(artist.slug);
  });
  return outbound;
}
