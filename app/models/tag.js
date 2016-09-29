function Tag(yargs) {
  if (!yargs) return; // no yargs means just instantiate the function.

  argv = yargs.demand(["t"]).argv;

  var e = require("../entitylib")(this,argv);

  this.coverage = {};
  if (argv.song) { this.coverage.song = true; }
  if (argv.artist) { this.coverage.artist = true; }
  if (argv.geo) { this.coverage.geo = true; }
}

Tag.prototype.typeSlug = "tag";
Tag.prototype.typeNoun = "tag";

Tag.prototype.parameters = {
  "s":"Tag (slug).",
  "t":"Title for the tag. (Req)"
}

module.exports = Tag;
