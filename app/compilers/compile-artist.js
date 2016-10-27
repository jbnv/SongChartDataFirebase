var chalk       = require("chalk"),
    util        = require("gulp-util"),

    Entity      = require('firehash'),

    display     = require('../display'),
    scoring     = require('../scoring'),
    transform   = require('../transform');

require("../polyfill");

var _inputs = {
  "artists": "artists/raw",
  "songs": "songs/compiled",
  "songs-raw": "songs/raw",
  "tags": "tags/raw",
  "roles": "roles/raw",
  "genres": "genres/raw",
  "locations": "geo/raw"
}

var _outputs = [
  ["entities", "artists/compiled"],
  ["titles", "artists/titles"],
  ["scores", "artists/scores"],
  ["errors", "artists/errors"]
];

function _transform(snapshot) {

  util.log(chalk.magenta("compile-artist.js"));

  var artists = snapshot[0].val() || {},
      allSongs = snapshot[1].val() || {},
      allSongsRaw = snapshot[2].val() || {},
      allTags = snapshot[3].val() || {},
      allRoles = snapshot[4].val() || {},
      allGenres = snapshot[5].val() || {},
      allLocations = snapshot[6].val() || {},
      allArtistTypes = require("../models/artist-types") || {},

      songsBy = new Entity();

      entities = {},
      titles = {},
      errors = [],
      roles = new Entity(),
      genres = new Entity(),
      origins = new Entity(),
      tags = new Entity();

  songsBy.extract("artists",allSongsRaw,function(x) { return true; });

  for (var slug in artists) {
    var entity = artists[slug];

    titles[slug] = entity.title;

    entity.songs = {};
    for (var songSlug in songsBy.get(slug) || {}) {
      var song = allSongs[songSlug];
      var role = allSongsRaw[songSlug].artists[slug];
      var scoreFactor = scoring.scoreFactor(role);
      entity.songs[songSlug] = {
        title: song.title,
        role: role,
        scoreFactor: scoreFactor,
        totalScore: song.score,
        score: song.score * scoreFactor
      }
      //console.log("[61]",entity.songs[songSlug]);
    }
    entity.songs = scoring.sortAndRank(entity.songs);

    scoring.scoreCollection.call(entity);
    entity.score = entity.songAdjustedAverage;

    var collaborators = new Entity();
    for (var songSlug in entity.songs) {
      var songEntity = allSongs[songSlug] || {};
      for (var artistSlug in (songEntity.artists || {})) {
        if (artistSlug == slug) continue;
        collaborators.push(artistSlug,songSlug,songEntity);
      }
    }
    entity.collaborators = {};
    collaborators.forEach(function(artistSlug,artistEntity) {
      var outbound = {
        slug: artistSlug,
        title: artistEntity.title || "MISSING '"+artistSlug+"'",
        songCount: Object.keys(collaborators.get(artistSlug) || {}).length
        //TEMP score: collaborators[artistSlug].scoreAdjustedAverage()
      };
      entity.collaborators[artistSlug] = outbound;
    });

    tags = transform.byList(tags,slug,entity.tags);
    entity.tags = transform.expand(entity.tags,allTags);

    roles = transform.byList(roles,slug,entity.roles);
    entity.roles = transform.expand(entity.roles,allRoles);

    genres = transform.byList(genres,slug,entity.genres);
    entity.genres = transform.expand(entity.genres,allGenres);

    var origin = entity.origin;
    if (origin) {
      origins.push(origin,slug,true);
      entity.origin = allLocations[origin] || origin;
    }

    if (entity.type) {
      var typeSlug = entity.type;
      entity.type = allArtistTypes[typeSlug];
      entity.type.slug = typeSlug;
    }

    // Make a shallow copy to prevent circular references.
    function _shallow(artist) {
      return {
        title: (artist || {}).title || "UNKNOWN"
      };
    }

    if (entity.members) {
      entity.members = transform.expand(entity.members,artists,_shallow);
    }

    if (entity.xref) {
      entity.xref = transform.expand(entity.xref,artists,_shallow);
    }

    util.log(
      chalk.blue(slug),
      entity.title,
      display.count(entity.songs),
      display.number(entity.songAdjustedAverage)
    );

    entities[slug] = entity;

  }

  /* Calculate song rankings on all terms.*/

  util.log("Ranking by genre.");
  scoring.rankEntities(entities,genres.get(),"genre");

  util.log("Ranking by origin.");
  scoring.rankEntities(entities,origins.get(),"origin");

  util.log("Ranking by tag.");
  scoring.rankEntities(entities,tags.get(),"tag");

  util.log("Artist processing complete.");

  entities = scoring.sortAndRank(entities,transform.sortBySongAdjustedAverage);

  var scores = {};
  for (var slug in entities) {
    scores[slug] = entities[slug].songAdjustedAverage;
  }

  return {
    "artists/compiled": entities,
    "artists/titles": titles,
    "artists/scores": scores,
    "artists/errors": errors,
    "artists/by-genre": genres,
    "artists/by-origin": origins,
    "artists/by-tag": tags,
    "artists/by-role": roles,
    "summary/artists/count": Object.keys(entities).length
  }

}

module.exports = {
  singular: "artists",
  plural: "artists",
  inputs: _inputs,
  outputs: _outputs,
  transform: _transform,
  entities: "artists/compiled",
  errors: "artists/errors"
}
