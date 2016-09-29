exports.match = function(song) {
  return !song.peak || !song["ascent-weeks"] || !song["descent-weeks"];
}
