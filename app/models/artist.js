function Artist(yargs) {
  if (!yargs) return; // no yargs means just instantiate the function.

  argv = yargs.demand(["t"]).argv;

  var e = require("../entitylib")(this,argv);
  e.array_argument("genres","g");
  e.array_argument("members","m");
  e.array_argument("xref","x");
  e.boolean_argument("complete","c");
  e.boolean_argument("active","a");
  this.origin = argv.o || "";
  this.birth = argv.birth || "";
  this.death = argv.death || "";

  // Type flags
  if (argv["male"]) {
    this.type = 'm';
  } else if (argv["female"]) {
    this.type = 'f';
  } else if (argv["type"]) {
    this.type = argv["type"];
  }

  // Legacy.
  if (argv.tags) this.tags = argv.tags.split(" ");
}

Artist.prototype.typeSlug = "artist";
Artist.prototype.typeNoun = "artist";

Artist.prototype.parameters = {
  "c":"Artist is complete.",
  "g":"Genre.",
  "m":"A member of the act.",
  "o":"Origin.",
  "s":"Slug. (Req)",
  "t":"Name of the artist. (Req)",
  "tags":"Tags. (Opt.)"
}

module.exports = Artist;
