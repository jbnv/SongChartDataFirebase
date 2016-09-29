function Source(yargs) {
  if (!yargs) return; // no yargs means just instantiate the function.

  argv = yargs.demand(["t"]).argv;

  var e = require("../entitylib")(this,argv);

  if (argv.movie) {
    this.type =  "movie";
  } else if (argv.tv) {
    this.type =  "tv";
  }
}

Source.prototype.typeSlug = "source";
Source.prototype.typeNoun = "source";

Source.prototype.parameters = {
  "s":"Slug. (Req)",
  "t":"Name of the breed. (Req)"
}

module.exports = Source;
