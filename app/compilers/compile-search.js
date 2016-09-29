var chalk = require("chalk"),
    fs = require("fs"),
    path = require('path'),
    util = require("gulp-util"),

    meta = require('../meta'),
    writeEntity = require('../../lib/fs').writeEntity;

require('../polyfill');

var transformsPath = path.join(meta.root,"raw","transform.json");

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

  var transmuted = this.replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/g,"");
  if (transmuted.length < 3) return null;

  //TODO Read and apply the transforms.json file

  var outbound = [];
  for (var length = 3; length <= transmuted.length; length++) {
    outbound.push(transmuted.substr(0,length));
  }

  return outbound;
}

// entities: array of entities of the type
module.exports = function(yargs) {

  // Array of slugs representing the recognized search terms.
  var terms = [];

  // slug: { "route", "title"}
  var entities = {};

  function process(typeSlug,inboundEntities) {

    util.log(chalk.blue(typeSlug),"Processing "+inboundEntities.length+" entities.");
    inboundEntities.forEach(function(entity) {

      // Entity does not have explicit search terms: Imply from title.
      var entityTerms = entity.searchTerms || (""+entity.title || "").toLowerCase().split(" ") || [];
      entityTerms = unique(entityTerms);

      var ref = {
        "type" : typeSlug,
        "route" : typeSlug+"/"+entity.instanceSlug,
        "title" : entity.title,
        "score" : entity.score || 0,
        "songCount": (entity.songs || []).length,
        "artistCount": (entity.artists || []).length,
      };

      entityTerms.forEach(function(term) {

        substrings = term.transmute();
        if (!substrings) return;

        substrings.forEach(function(term) {
          if (terms.includes(term)) {
            entities[term].push(ref);
          } else {
            terms.push(term);
            entities[term] = [ref];
          }
        });

      }); // entityTerms

    }); // entities
  }

  process("artist",meta.getArtists());
  process("genre",meta.getGenres());
  process("geo",meta.getLocations());
  process("playlist",meta.getPlaylists());
  process("source",meta.getSources());
  process("song",meta.getSongs());

  var termsRoute = meta.compiledRoute("search","terms");
  terms = terms.sort();
  writeEntity(termsRoute,terms);

  terms.forEach(function(term) {
    if (!entities[term]) return; // This shouldn't happen but is here to prevent errors.
    writeEntity(meta.compiledRoute("search",term),entities[term]);
    //util.log(chalk.blue(term),chalk.gray(entities[term].length));
  })

  util.log("Compiled "+chalk.green(terms.length)+" entities.");
}
