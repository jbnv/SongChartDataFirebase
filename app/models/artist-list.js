var e = require("../entitylib");

function ArtistList(yargs) {
  if (!yargs) return; // no yargs means just instantiate the function.

  argv = yargs.demand(["t"]).argv;

  var e = require("../entitylib")(this,argv);
}

ArtistList.prototype.typeSlug = "artist-list";
ArtistList.prototype.typeNoun = "artist-list";

ArtistList.prototype.parameters = {
  "s":"Slug.",
  "t":"Name of the list. (Req)"
}

module.exports = ArtistList;
