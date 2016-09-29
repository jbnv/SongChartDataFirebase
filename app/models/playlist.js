var e = require("../entitylib");

function Playlist(yargs) {
  if (!yargs) return; // no yargs means just instantiate the function.

  argv = yargs.demand(["t"]).argv;

  var e = require("../entitylib")(this,argv);
}

Playlist.prototype.typeSlug = "playlist";
Playlist.prototype.typeNoun = "playlist";

Playlist.prototype.parameters = {
  "s":"Slug.",
  "t":"Name of the breed. (Req)"
}

module.exports = Playlist;
