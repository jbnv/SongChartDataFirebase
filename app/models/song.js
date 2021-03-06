var Hasher = require("hashids");

function Song(yargs) {
  if (!yargs) return; // no yargs means just instantiate the function.

  argv = yargs.demand(["t"]).argv;

  var e = require("../entitylib")(this,argv);

  this.debut = argv.d;
  this.source = argv.source || null;
  this.peak = argv.peak || null;
  this["ascent-weeks"] = argv.ascent || null;
  this["descent-weeks"] = argv.descent || null;
  e.array_argument("genres","g");
  e.array_argument("playlists","p");

  function addArtist(a) {
    a1 = (""+a).split(":");
    artistSlug = a1[0];
    roleSlug =  a1[1] || true;
    if (roleSlug == 'co') roleSlug = true;
    artistObj[artistSlug] = roleSlug;
  }

  artistArgs = argv.a;
  artistObj = {};
  if (artistArgs) {
    if (artistArgs instanceof Array) {
      artistArgs.forEach(addArtist);
    } else {
      addArtist(artistArgs);
    }
  }
  this["artists"] = artistObj;

  if (!argv.s) {
    firstArtist = Object.keys(artistObj)[0] || "";
    hasher = new Hasher(firstArtist+":"+this.title,4);
    this.instanceSlug = hasher.encode(1);
  }

  // Legacy.
  if (argv.tags) this.tags = argv.tags.split(" ");
}

Song.prototype.typeSlug = "song";
Song.prototype.typeSlugPlural = "songs";
Song.prototype.typeNoun = "song";

Song.prototype.parameters = {
  "a":"Artist, with optional role.",
  "d":"Debut date.",
  "g":"Genre(s).",
  "p":"Playlist(s).",
  "s":"Slug. (Req)",
  "t":"Name of the breed. (Req)"
}

module.exports = Song;
