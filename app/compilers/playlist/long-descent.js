exports.match = function(song) {
  return parseFloat(song["descent-weeks"] || 0) > 20;
}
