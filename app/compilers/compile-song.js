var chalk       = require("chalk"),
    util        = require("gulp-util"),
    numeral     = require("numeral"),

    Entity      = require('../../lib/entity'),

    data        = require('../data'),
    scoring     = require('../scoring'),
    transform   = require('../transform');

require("../polyfill");

var _inputs = {
  "songs": "songs/raw",
  "artists": "artists/raw",
  "tags": "tags/raw",
  "roles": "roles/raw"
};

var _outputs = [
  ["entities", "songs/compiled"],
  ["titles", "songs/titles"],
  ["errors", "songs/errors"]
];

// Validation before processing.
function _prevalidate(slug,song) {

  var messages = new Entity();

  if (!song.peak) {
    messages[slug+":peak"] = {
      type:"warning",
      title:"Peak Not Set",
      text:"Peak set dynamically based on average of all scored songs."
    };
  }

  if (!song["ascent-weeks"]) {
    messages[slug+":ascent"] = {
      type:"warning",
      title:"Ascent Not Set",
      text:"Ascent set dynamically based on average of all scored songs."
    };
  }

  if (!song["descent-weeks"]) {
    messages[slug+":descent"] = {
      type:"warning",
      title:"Descent Not Set",
      text:"Descent set dynamically based on average of all scored songs."
    };
  }

  if (!song.complete && song["descent-weeks"] > 13) {
    messages[slug+":long-descent"] = {
      type:"warning",
      title:"Long Descent",
      text:"Descent longer than 13 weeks. Adjust or confirm."
    };
  }

  return messages;

}

// Validation after processing.
// song: Entity
function _postvalidate(slug,song) {

  var messages = {};

  if (!song.title) {
    messages[slug+":title"] = {
      type:"error",
      title:"Title Not Set"
    };
  }

  if (Object.keys(song.genres || {}).length == 0 && !song.genre) {
    messages[slug+":genre"] = {
      type:"warning",
      title:"Genre Not Set"
    };
  }

  if (!song.debut) {
    messages[slug+":debut"] = {
      type:"warning",
      title:"Debut Not Set"
    };
  }

  // Indicator: The "remake", "remix" or "sample" property is "true."

  if (song.remake && song.remake === true) {
    messages[slug+":remake"] = {
      type:"warning",
      title:"Remake Reference Not Set",
      text:"The 'remake' property is present and set to 'true'. Set to the referenced song."
    };
  }

  if (song.remix && song.remix === true) {
    messages[slug+":remix"] = {
      type:"warning",
      title:"Remix Reference Not Set",
      text:"The 'remix' property is present and set to 'true'. Set to the referenced song."
    };
  }

  if (song.sample && song.sample === true) {
    messages[slug+":sample"] = {
      type:"warning",
      title:"Sample Reference Not Set",
      text:"The 'sample' property is present and set to 'true'. Set to the referenced song."
    };
  }

  if (song.remake || song.remix || song.sample) {
    var writerSet = false;
    var artists = song.artists || {};
    for (var slug in artists) {
      writerSet = writerSet || artists[slug] === "writer";
    }
    if (!writerSet) {
      messages[slug+":writer"] = {
        type:"warning",
        title:"Writer Not Set",
        text:"This song has a property that indicates that the recording artist is not the writer. Please locate the writer."
      };
    }

  }

  return messages;

}

function _aggregate(songs) {

  var peaks = [], ascents = [], descents = [];

  // Aggregation pass.
  for (var slug in songs) {
    var song = songs[slug];

    if (song["peak"]) {
      peaks.push(song["peak"]);
    }

    if (song["ascent-weeks"]) {
      ascents.push(song["ascent-weeks"]);
    }

    if (song["descent-weeks"]) {
      descents.push(song["descent-weeks"]);
    }

  }

  var peaksSum = peaks.sum();

  return {
    averagePeak: peaksSum/(2*peaks.length-peaksSum),
    averageAscent: ascents.sum()/ascents.length,
    averageDescent: descents.sum()/descents.length
  };

}

function _transform(snapshot) {

  util.log(chalk.magenta("compile-song.js"));

  var songs = snapshot[0].val() || {},
      allArtists = snapshot[1].val() || {},
      allTags = snapshot[2].val() || {},
      allRoles = snapshot[3].val() || {},

      entities = {},
      titles = {},
      artists = {},
      genres = {},
      playlists = {},
      sources = {}, //new Entity(),
      tags = {},
      decades = {},
      years = {},
      months = {},
      unscored = {},
      errors = {},

      aggregates = _aggregate(songs);

  // Processing pass.

  for (var slug in songs) {
    var entity = new Entity(songs[slug]);
    util.log(chalk.blue(slug)); //TEMP

    titles[slug] = entity.title();
    entity.messages = {};

    var prevalidateMessages = _prevalidate(slug,entity) || {};
    entity.addMessage(prevalidateMessages);

    entity.set("unscored",!entity["peak"]);

    entity.setDefault("peak",aggregates.averagePeak);
    entity.setDefault("ascent-weeks",aggregates.averageAscent);
    entity.setDefault("descent-weeks",aggregates.averageDescent);

    var songScored = scoring.score(entity);
    entity.set("score",songScored.score);
    entity.set("duration",songScored.duration);

    // Map singular fields to corresponding plurals.
    entity.fix("genre","genres");
    entity.fix("playlist","playlists");
    entity.fix("source","sources");

    // Processing complete.

    var postvalidateMessages = _postvalidate(slug,entity) || {};
    entity.addMessage(postvalidateMessages);

    numeral.zeroFormat("");

    util.log(
      chalk.blue(slug),
      entity.title(),
      chalk.gray(numeral(entity.get("score")).format("0.00"))
    );

    entities[slug] = entity.export();

  }

  return {
    "songs/compiled": entities,
    "songs/titles": titles,
    "songs/errors": errors,
    "songs/by-artist": artists,
    "songs/by-genre": genres,
    "songs/by-tag": tags,
    "songs/by-playlist": playlists,
    "songs/by-source": sources,
    "songs/by-decade": decades,
    "songs/by-year": years,
    "songs/by-month": months,
    "songs/unscored": unscored
  }

}

module.exports = {
  singular: "songs",
  plural: "songs",
  inputs: _inputs,
  outputs: _outputs,
  transform: _transform,
  entities: "songs/compiled",
  errors: "songs/errors"
}

// function transformArtist(artist,slug,roleSlug) {
//   return {
//     slug: slug,
//     title: artist.title,
//     type: artist.type,
//     roleSlug: roleSlug,
//     death: artist.death,
//     tags: (artist.tags || [])
//       .map(function(tag) { return (tag || {}).instanceSlug; })
//       .filter(function(tag) { return tag; })
//   };
// }
//
//
// // entities: array of entities of the type
// module.exports = function(yargs,entities) {
//   util.log(chalk.magenta("compile-song.js"));
//
//   allArtists = meta.getArtists();
//
//   var titles = {},...
//
//   var playlistDefs = {};
//   fs.readdirSync(path.join(meta.root,"app","compilers","playlist"))
//   .forEach(function(filename) {
//     filenameTrunc = filename.replace(".js","");
//     playlist = require("./playlist/"+filenameTrunc);
//     playlistDefs[filenameTrunc] = playlist;
//   });
//
//   // [Aggregation pass]
//
//   // Processing pass.
//   entities.forEach(function(entity) {
//     if (entity.error) { errors.push(entity); return; }
//
//     prevalidate(entity);
//
//     var slug = entity.instanceSlug;
//     if (!slug) return;
//
//     entity.ranks = {};
//     titles[entity.instanceSlug] = entity.title;
//
//...
//
//     if (entity.artists) {
//       for (var artistSlug in entity.artists) {
//         var artist = entity.artists[artistSlug] || {};
//         if (!artists[artistSlug]) artists[artistSlug] = [];
//         var entityClone = clone(entity);
//         delete entityClone.artists;
//         entityClone.role = artist; //FUTURE artist.roleSlug;
//         entityClone.scoreFactor = 1.00; //FUTURE artist.scoreFactor;
//         switch (entityClone.role) {
//           case true: entityClone.scoreFactor = 1.00; break;
//           case "feature": entityClone.scoreFactor = 0.20; break;
//           case "lead": entityClone.scoreFactor = 0.75; break;
//           case "backup": entityClone.scoreFactor = 0.10; break;
//           case "writer": entityClone.scoreFactor = 1.00; break;
//           case "producer": entityClone.scoreFactor = 0.50; break;
//           case "sample": entityClone.scoreFactor = 0.1; break;
//           case "remake": entityClone.scoreFactor = 0.1; break;
//           case "remix": entityClone.scoreFactor = 0.25; break;
//           default: entityClone.scoreFactor = 0.25;
//         }
//         entityClone.totalScore = entityClone.score;
//         if (entityClone.score) entityClone.score *= entityClone.scoreFactor;
//         artists[artistSlug].push(entityClone);
//       }
//       entity.artists = expandObject.call(entity.artists,allArtists,transformArtist);
//     } else {
//        entity.artists = [];
//     }
//
//     if (entity.genres) {
//       entity.genres.forEach(function(genreSlug) {
//         if (!genres[genreSlug]) genres[genreSlug] = [];
//         genres[genreSlug].push(entity);
//       });
//     }
//
//     try {
//       entity.genres = lookupEntities(entity.genres,"genre");
//     } catch(err) {
//       errors.push({"instanceSlug":slug,"stage":"genres","error":err});
//     }
//
//     if (entity.sources) {
//       entity.sources.forEach(function(sourceSlug) {
//         if (!sources[sourceSlug]) sources[sourceSlug] = [];
//         sources[sourceSlug].push(entity);
//       });
//     }
//
//     try {
//       entity.sources = lookupEntities(entity.sources,"source");
//     } catch(err) {
//       errors.push({"instanceSlug":slug,"stage":"source","error":err});
//     }
//
//     if (entity.debut && entity.debut !== "") {
//       var era = new Era(entity.debut);
//       entity.debutEra = era.clone();
//       if (era.decade) { pushToCollection(decades,""+era.decade+"s",entity); }
//       if (era.year) { pushToCollection(years,era.year,entity); }
//       //TEMP Month push needs to actually put the song in all months to which is is scoreed.
//       if (era.month) {
//         // Loop through the scores
//         pushToCollection(months,entity.debut,entity);
//       }
//     }
//
//     numeral.zeroFormat("");
//
//     // Check against playlist rules.
//     // This needs to happen after all other processing takes place.
//
//     Object.keys(playlistDefs).forEach(function(key) {
//       var playlist = playlistDefs[key];
//       if (playlist.match(entity)) entity.playlists.push(key);
//     });
//
//     if (entity.playlists) {
//       entity.playlists.forEach(function(playlistSlug) {
//         if (!playlists[playlistSlug]) playlists[playlistSlug] = [];
//         playlists[playlistSlug].push(entity);
//       });
//     }
//
//     try {
//       entity.playlists = lookupEntities(entity.playlists,"playlist");
//     } catch(err) {
//       errors.push({"instanceSlug":slug,"stage":"playlists","error":err});
//     }
//
//     postvalidate(entity);
//
//   });
//
//   /* Calculate song rankings on all terms.*/
//
//   util.log("Ranking by artist.");
//   scoring.rankEntities(entities,artists,"artist");
//
//   util.log("Ranking by genre.");
//   scoring.rankEntities(entities,genres,"genre");
//
//   util.log("Ranking by playlist.");
//   scoring.rankEntities(entities,playlists,"playlist");
//
//   util.log("Ranking by source.");
//   scoring.rankEntities(entities,sources,"source");
//
//   util.log("Ranking by decade.");
//   scoring.rankEntities(entities,decades,"decade");
//
//   util.log("Ranking by year.");
//   scoring.rankEntities(entities,years,"year");
//
//   // months = {},
//
//   util.log("Song processing complete.");
//
//   entities = scoring.sortAndRank(entities);
//
//   entities.forEach(function(song) {
//
//     if (song.rank && (song.rank <= 100) && !song.complete) {
//       song.messages.push({
//         type:"warning",
//         title:"Incomplete",
//         text:"This song has a high ranking but is not marked as complete. May need a writer and/or producer."
//       });
//     }
//
//     var debutType = (song.debutEra || {}).type || "";
//
//     if (
//       song.rank && (song.rank <= 100)
//       && (!/^((month)|(day))$/.test(debutType))
//     ) {
//       song.messages.push({
//         type:"warning",
//         title:"Debut Granularity",
//         text:"Please make the debut more specific."
//       });
//     } else if (
//       song.rank && (song.rank <= 1000)
//       && (!/^((year)|(month)|(day))$/.test(debutType))
//     ) {
//       song.messages.push({
//         type:"warning",
//         title:"Debut Granularity",
//         text:"Please make the debut more specific."
//       });
//     }
//
//
//   });
//
//   return {...}
// }
