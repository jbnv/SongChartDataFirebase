var chalk       = require("chalk"),
    util        = require("gulp-util");
    numeral     = require("numeral"),

    scoring     = require('../scoring');

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
  roles = {};
  genres = {};
  origins = {};
  tags = {};

    for (var slug in artists) {
      var entity = artists[slug];
      console.log(chalk.cyan(slug));

      titles[slug] = entity.title;

      var entitySongs = songsByArtist[slug] || [];

      entity.songs = scoring.sortAndRank(entitySongs);
      scoring.scoreCollection.call(entity);

      // var collaborators = {};
      // entity.songs.forEach(function(song) {
      //   var songEntity = allSongs[song.instanceSlug];
      //   Object.keys(songEntity.artists || {}).forEach(function(artistSlug) {
      //     if (artistSlug == slug) return;
      //     if (!collaborators[artistSlug]) collaborators[artistSlug] = [];
      //     collaborators[artistSlug].push(song);
      //   });
      // });
      // entity.collaborators = {};
      // Object.keys(collaborators).forEach(function(artistSlug) {
      //   var artistEntity = artists[artistSlug] || {};
      //   var outbound = {
      //     slug: artistSlug,
      //     title: artistEntity.title || "MISSING '"+artistSlug+"'",
      //     songCount: collaborators[artistSlug].length,
      //     score: collaborators[artistSlug].scoreAdjustedAverage()
      //   };
      //   entity.collaborators[artistSlug] = outbound;
      // });

      console.log("[74]");
      tags = meta.byList(tags,slug,entity.tags);

      console.log("[75]");
      var tagsExpanded = {};
      for (var key in entity.tags) {
        tagsExpanded[key] = allTags[key];
      }
      entity.tags = tagsExpanded;

      console.log("[84]");
      roles = meta.byList(roles,slug,entity.roles);

      console.log("[85]");
      var rolesExpanded = {};
      for (var key in entity.roles) {
        rolesExpanded[key] = allTags[key];
      }
      entity.roles = rolesExpanded;

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
//     numeral.zeroFormat("");
//
//     // util.log(
//     //   chalk.blue(entity.instanceSlug),
//     //   entity.title,
//     //   chalk.gray(numeral(entity.songs.length).format("0")),
//     //   chalk.gray(numeral(entity.score || 0).format("0.00")),
//     //   chalk.gray(numeral(entity.songAdjustedAverage || 0).format("0.00"))
//     // );
//
//   });
//

      entities[slug] = entity;

    } // for slug in artists

    db.ref("artists/compiled").set(entities);
    db.ref("artists/titles").set(titles);
    db.ref("artists/by-genre").set(genres);
    db.ref("artists/by-origin").set(origins);
    db.ref("artists/by-tag").set(tags);
    db.ref("artists/by-role").set(roles);

    return {
      entityCount: Object.keys(entities).length,
      errorCount: errors.length
    };

  });
};

//
//   /* Calculate song rankings on all terms.*/
//
//   util.log("Ranking by genre.");
//   scoring.rankEntities(entities,genres,"genre");
//
//   util.log("Ranking by origin.");
//   scoring.rankEntities(entities,origins,"origin");
//
//   util.log("Ranking by tag.");
//   scoring.rankEntities(entities,tags,"tag");
//
//   util.log("Artist processing complete.");
//
//   entities = scoring.sortAndRank(entities,transform.sortBySongAdjustedAverage);
