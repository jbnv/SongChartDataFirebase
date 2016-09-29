var e = require("../entitylib");

function Genre(yargs) {
  if (!yargs) return; // no yargs means just instantiate the function.

  argv = yargs.demand(["t"]).argv;

  var e = require("../entitylib")(this,argv);
}

Genre.prototype.typeSlug = "genre";
Genre.prototype.typeNoun = "genre";

Genre.prototype.parameters = {
  "s":"Slug.",
  "t":"Name of the breed. (Req)"
}

module.exports = Genre;
