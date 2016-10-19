var chalk       = require("chalk"),
    util        = require("gulp-util");
    numeral     = require("numeral"),

    Entity      = require('../../lib/entity'),

    data        = require('../data'),
    scoring     = require('../scoring'),
    transform   = require('../transform');

require("../polyfill");

var _inputs = {
  "artists": "artists/raw",
  "songsByArtist": "songs/by-artist",
  "tagsForArtist": "tags/for-artist",
  "songs": "songs/compiled",
  "tags": "tags/raw",
  "roles": "roles/raw"
}

var _outputs = [
  ["entities", "artists/compiled"],
  ["titles", "artists/titles"],
  ["errors", "artists/errors"]
];

function _transform(snapshot) {

  util.log(chalk.magenta("compile-artist.js"));

  var artists = snapshot[0].val() || {};
  var songsByArtist = snapshot[1].val() || {};
  var tagsForArtist = snapshot[2].val() || {};
  var allSongs = snapshot[3].val() || {};
  var allTags = snapshot[4].val() || {};
  var allRoles = snapshot[5].val() || {};
  var allArtistTypes = require("../models/artist-types") || {};

  entities = {};
  titles = {};
  errors = [];
  roles = new Entity(),
  genres = new Entity(),
  origins = new Entity(),
  tags = new Entity();

  console.log(Object.keys(artists).length);

  for (var slug in artists) {
    var entity = artists[slug];

    titles[slug] = entity.title;

    entity.songs = scoring.sortAndRank(songsByArtist[slug] || {});
    scoring.scoreCollection.call(entity);

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

      // if (entity.genres) {
      //   for (var genre in entity.genres) {
      //     // Record in the outbound list.
      //     if (!genres[genre]) genres[genre] = [];
      //     genres[genre].push(entity);
      //     // Expand this entity.
      //     db.ref("genres").child(genre).once('value')
      //     .then(function(snapshot) {
      //       entity.genres[genre] = snapshot.val();
      //     })
      //   }
      // }

//     if (entity.genres) {
//       entity.genres.forEach(function(genreSlug) {
//         if (!genres[genreSlug]) genres[genreSlug] = [];
//         genres[genreSlug].push(entity);
//       });
//       entity.genres = lookupEntities(entity.genres,"genre");
//     }
//
//     if (entity.origin) {
//         if (!origins[entity.origin]) origins[entity.origin] = [];
//         origins[entity.origin].push(entity);
//         entity.origin = lookupEntity(entity.origin,"geo");
//     }
//
//     if (entity.type) {
//       var typeSlug = entity.type;
//       entity.type = allArtistTypes[typeSlug];
//       entity.type.slug = typeSlug;
//     }
//
//     if (entity.members) {
//       entity.members = lookupEntities(entity.members,"artist");
//     }
//
//     if (entity.xref) {
//       entity.xref = lookupEntities(entity.xref,"artist");
//     }
//
    numeral.zeroFormat("");

    util.log(
      chalk.blue(entity.instanceSlug),
      entity.title,
      chalk.gray(numeral(entity.songs.length).format("0")),
      chalk.gray(numeral(entity.score || 0).format("0.00")),
      chalk.gray(numeral(entity.songAdjustedAverage || 0).format("0.00"))
    );

    entities[slug] = entity;

  }

  /* Calculate song rankings on all terms.*/

  util.log("Ranking by genre.");
  scoring.rankEntities(entities,genres.export(),"genre");

  util.log("Ranking by origin.");
  scoring.rankEntities(entities,origins.export(),"origin");

  util.log("Ranking by tag.");
  scoring.rankEntities(entities,tags.export(),"tag");

  util.log("Artist processing complete.");

  entities = scoring.sortAndRank(entities,transform.sortBySongAdjustedAverage);

  return {
    "artists/compiled": entities,
    "artists/titles": titles,
    "artists/errors": errors,
    "artists/by-genre": genres,
    "artists/by-origin": origins,
    "artists/by-tag": tags,
    "artists/by-role": roles
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
