function Location(yargs) {
  if (!yargs) return; // no yargs means just instantiate the function.

  argv = yargs.demand(["t"]).argv;

  var e = require("../entitylib")(this,argv);
}

Location.prototype.typeSlug = "geo";
Location.prototype.typeNoun = "location";

Location.prototype.parameters = {
  "s":"Slug. (Req)",
  "t":"Name of the breed. (Req)"
}

module.exports = Location;
