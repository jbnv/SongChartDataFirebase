require("../polyfill");

var _inputs = {
  "artists": "artists/compiled",
  "genres": "genres/compiled",
  "locations": "geo/compiled",
  "playlists": "playlists/compiled",
  "roles": "roles/compiled",
  "songs": "songs/compiled",
  "sources": "sources/compiled",
  "tags": "tags/compiled"
};

var _outputs = [
  ["terms", "search/terms"],
  ["errors", "search/errors"]
];

function unique(a) {
    var prims = {"boolean":{}, "number":{}, "string":{}}, objs = [];

    return a.filter(function(item) {
        var type = typeof item;
        if(type in prims)
            return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
        else
            return objs.indexOf(item) >= 0 ? false : objs.push(item);
    });
}

// Return an array of terms that the term could match.
String.prototype.transmute = function() {

  var transmuted = this.replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~\n]/g,"");
  if (transmuted.length < 3) return null;

  // Excluded words.
  if (/^the$/.test(transmuted)) return null;

  var outbound = [];
  for (var length = 3; length <= transmuted.length; length++) {
    outbound.push(transmuted.substr(0,length));
  }

  return outbound;
}

function _transform(snapshot) {

  var chalk       = require("chalk"),
      util        = require("gulp-util"),

      Entity      = require('../../lib/entity'),

      display     = require('../display'),
      scoring     = require('../scoring'),
      transform   = require('../transform');

  util.log(chalk.magenta("compile-search.js"));

  var entities = new Entity();

  function process(typeSlug,inboundEntities) {

    util.log(chalk.blue(typeSlug),"Processing "+Object.keys(inboundEntities).length+" entities.");

    for (var slug in inboundEntities) {

      var entity = inboundEntities[slug],
          routeSlug = typeSlug+"_"+slug,
          route = typeSlug+"/"+slug,
          ref = {
            "type" : typeSlug,
            "route" : route,
            "title" : entity.title,
            "score" : entity.score || 0,
            "songCount": Object.keys(entity.songs || {}).length,
            "artistCount": Object.keys(entity.artists || {}).length
          };

      // Entity does not have explicit search terms: Imply from title.
      var entityTerms = function(e) {
        if (e.searchTerms) return Object.keys(e.searchTerms);
        if (e["search-terms"]) return Object.keys(e["search-terms"]);
        if (e.title) return (""+e.title || "").toLowerCase().split(" ");
        return [];
      }(entity);

      unique(entityTerms).forEach(function(term) {

        substrings = term.transmute();
        if (!substrings) return;

        substrings.forEach(function(substring) {
          entities.push(substring,routeSlug,ref);
        });

      }); // entityTerms

    }
  }

  process("artist",snapshot[0].val() || {});
  process("genre",snapshot[1].val() || {});
  process("geo",snapshot[2].val() || {});
  process("playlist",snapshot[3].val() || {});
  process("role",snapshot[4].val() || {});
  process("song",snapshot[5].val() || {});
  process("source",snapshot[6].val() || {});
  process("tag",snapshot[7].val() || {});

  return {
    "search/terms": entities.export(),
    "search/errors": {}
  }

}

module.exports = {
singular: "search",
plural: "search",
inputs: _inputs,
outputs: _outputs,
transform: _transform,
entities: "search/terms",
errors: "search/errors"
}
