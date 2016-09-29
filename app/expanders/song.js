var readEntity  = require("../../lib/fs").readEntity,
    lookupEntity = require("../../lib/fs").lookupEntity,
    lookupEntities = require("../../lib/fs").lookupEntities;

require("../polyfill");

module.exports = function(song) {

  song.errors = song.errors || [];

  try {
    song.genres = lookupEntities(song.genres,"genre");
  } catch(err) {
    song.errors.push({"instanceSlug":slug,"stage":"genres","error":err});
  }

  try {
    song.sources = lookupEntities(song.sources,"source");
  } catch(err) {
    song.errors.push({"instanceSlug":slug,"stage":"source","error":err});
  }

  return song;
}
