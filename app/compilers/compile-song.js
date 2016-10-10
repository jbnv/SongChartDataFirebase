var chalk       = require("chalk"),
    fs          = require("fs"),
    path        = require("path"),
    util        = require("gulp-util"),
    numeral     = require("numeral"),

    Entity      = require('../../lib/entity'),
    Era         = require('../../lib/era'),
    _match       = require('../../lib/match'),

    data        = require('../data'),
    scoring     = require('../scoring'),
    transform   = require('../transform');

require("../polyfill");

var _inputs = {
  "songs": "songs/raw",
  "artists": "artists/raw",
  "playlists": "playlists/raw",
  "roles": "roles/raw",
  "tags": "tags/raw",
  "genres": "genres/raw",
  "sources": "sources/raw"
};

var _outputs = [
  ["entities", "songs/compiled"],
  ["titles", "songs/titles"],
  ["errors", "songs/errors"]
];

// Validation before processing.
function _prevalidate(slug,song) {

  var messages = new Entity();

  if (!song.get("peak")) {
    messages[slug+":peak"] = {
      type:"warning",
      title:"Peak Not Set",
      text:"Peak set dynamically based on average of all scored songs."
    };
  }

  if (!song.get("ascent-weeks")) {
    messages[slug+":ascent"] = {
      type:"warning",
      title:"Ascent Not Set",
      text:"Ascent set dynamically based on average of all scored songs."
    };
  }

  if (!song.get("descent-weeks")) {
    messages[slug+":descent"] = {
      type:"warning",
      title:"Descent Not Set",
      text:"Descent set dynamically based on average of all scored songs."
    };
  }

  if (!song.get("complete") && song.get("descent-weeks") > 13) {
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
function _postvalidate(slug,songEntity) {

  var song = songEntity.export(), messages = {}

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

// Returns true or false if the song matches this particular playlist.
function _playlistMatch(playlist,song) {
  var slug = playlist.slug;
  var reducer = playlist.reducer;
  var filter = playlist.filter;

  // Custom reducer?
  if (reducer === true) {
    //console.log("[185]",chalk.cyan(slug),"reducer === true: playlist",slug); //TEMP
    return require("./playlist/"+slug).match(song);
  }

  // General reducer?
  if (reducer) {
    //console.log("[192]",chalk.cyan(slug),"educers",reducer,slug); //TEMP
    return require("../reducers/"+reducer)(slug)(song);
  }

  // Filter?
  if (filter) {
    //console.log("[199]",chalk.cyan(slug),"filter"); //TEMP
    var matchesAll = true;
    for (var field in filter) {
      var songField = song[field];
      var filterField = filter[field];
      if (typeof filterField === "string") filterField = new RegExp(filterField);
      var isMatch = _match(songField,filterField);
      matchesAll = matchesAll && isMatch;
      //console.log("[202] -",songField,filterField,isMatch); //TEMP
    }
    return matchesAll;
  }

  // Explicit match?
  if ((song.playlists || {})[slug]) return true;

  return false;
}

function _transform(snapshot) {

  util.log(chalk.magenta("compile-song.js"));

  var songs = snapshot[0].val() || {},
      allArtists = snapshot[1].val() || {},
      allPlaylists = snapshot[2].val() || {},
      allRoles = snapshot[3].val() || {},
      allTags = snapshot[4].val() || {},
      allGenres = snapshot[3].val() || {},
      allSources = snapshot[4].val() || {},

      entities = {},
      titles = {},
      artists = new Entity(),
      genres = new Entity(),
      playlists = new Entity(),
      sources = new Entity(),
      tags = new Entity(),
      decades = new Entity(),
      years = new Entity(),
      months = new Entity(),
      unscored = {},
      errors = {},

      aggregates = _aggregate(songs);

  // Processing pass.

  for (var slug in songs) {
    var entity = new Entity(songs[slug]);
    var entityRaw = songs[slug];

    util.log(chalk.blue(slug)); //TEMP

    titles[slug] = entity.title();
    entity.messages = {};

    var prevalidateMessages = _prevalidate(slug,entity) || {};
    entity.addMessage(prevalidateMessages);

    entity.set("unscored",!entity.get("peak"));

    entity.setDefault("peak",aggregates.averagePeak);
    entity.setDefault("ascent-weeks",aggregates.averageAscent);
    entity.setDefault("descent-weeks",aggregates.averageDescent);

    var songScored = scoring.score(entity.export());
    entity.set("score",songScored.score);
    entity.set("duration",songScored.duration);

    // Map singular fields to corresponding plurals.
    entity.fix("genre","genres");
    entity.fix("playlist","playlists");
    entity.fix("source","sources");

    var songArtists = entity.get("artists") || {};
    for (var artistSlug in songArtists) {
      var artistRole = songArtists[artistSlug] || {};
      var entityClone = entity.export(); // need to actually make a copy here
      delete entityClone.artists;
      entityClone.role = artistRole; //FUTURE artist.roleSlug;
      entityClone.scoreFactor = 1.00; //FUTURE artist.scoreFactor;
      switch (entityClone.role) {
        case true: entityClone.scoreFactor = 1.00; break;
        case "feature": entityClone.scoreFactor = 0.20; break;
        case "lead": entityClone.scoreFactor = 0.75; break;
        case "backup": entityClone.scoreFactor = 0.10; break;
        case "writer": entityClone.scoreFactor = 1.00; break;
        case "producer": entityClone.scoreFactor = 0.50; break;
        case "sample": entityClone.scoreFactor = 0.1; break;
        case "remake": entityClone.scoreFactor = 0.1; break;
        case "remix": entityClone.scoreFactor = 0.25; break;
        default: entityClone.scoreFactor = 0.25;
      }
      entityClone.totalScore = entityClone.score;
      if (entityClone.score) entityClone.score *= entityClone.scoreFactor;
      var artist = allArtists[artistSlug] || {};
      artists.push(artistSlug,slug,entityClone);
      entity.push("artists",artistSlug,{
        title: artist.title || "NOT FOUND",
        type: artist.type || null,
        roleSlug: artistRole,
        death: artist.death || null,
        tags: artist.tags || null
        // tags: (artist.tags || {})
        //   .map(function(tag) { return (tag || {}).instanceSlug; })
        //   .filter(function(tag) { return tag; })
      });
    }

    try {
      for (var genreSlug in entity.get("genres")) {
        var genre = allGenres[genreSlug] || {};
        genres.push(genreSlug,slug,true);
        entity.push("genres",genreSlug,genre.title || "NOT FOUND");
      }
    } catch(err) {
      errors[slug+":genres"] = err;
    }

    try {
      for (var sourceSlug in entity.get("sources")) {
        var source = allSources[sourceSlug] || {};
        sources.push(sourceSlug,slug,true);
        entity.push("sources",sourceSlug,source.title || "NOT FOUND");
      }
    } catch(err) {
      errors[slug+":sources"] = err;
    }

    var debut = entity.get("debut");
    if (debut && debut !== "") {
      var era = new Era(debut);
      entity.set("debutEra",era.clone());
      if (era.decade) {
        decades.push(""+era.decade+"s",slug,true);
      }
      if (era.year) {
        years.push(era.year,slug,true);
      }
      //TEMP Month push needs to actually put the song in all months to which is is scoreed.
      if (era.month) {
        // Loop through the scores
        months.push(entity.debut,slug,true);
      }
    }

    // Check against playlist rules.
    // This needs to happen after all other processing takes place.

    try {
      for (var playlistSlug in allPlaylists) {
        var playlist = allPlaylists[playlistSlug] || {};
        playlist.slug = playlistSlug;
        try {
          if (_playlistMatch(playlist,entityRaw)) {
            playlists.push(playlistSlug,slug,true);
            entity.push("playlists",playlistSlug,playlist.title || "NOT FOUND");
          }
        } catch(err) {
          //console.log("[329]",playlistSlug,"ERROR",err); //TEMP
          errors[slug+":playlist:"+playlistSlug] = {
            message: "Error evaluating function: "+err,
            entity: entityRaw
          }
        }
      }
    } catch(err) {
      errors[slug+":playlists"] = err;
    }

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
    //console.log(entity.export());
  }

  util.log("Song processing complete.");

  entities = scoring.sortAndRank(entities);

  for (var slug in entities) {
    var song = entities[slug];
    if (!song.messages) song.messages = {};

    if (song.rank && (song.rank <= 100) && !song.complete) {
      song.messages["incomplete"] = {
        type:"warning",
        title:"Incomplete",
        text:"This song has a high ranking but is not marked as complete. May need a writer and/or producer."
      };
    }

    var debutType = (song.debutEra || {}).type || "";

    if (
      song.rank && (song.rank <= 100)
      && (!/^((month)|(day))$/.test(debutType))
    ) {
      song.messages["granularity"] = {
        type:"warning",
        title:"Debut Granularity",
        text:"Please make the debut more specific."
      };
    } else if (
      song.rank && (song.rank <= 1000)
      && (!/^((year)|(month)|(day))$/.test(debutType))
    ) {
      song.messages["granularity"] = {
        type:"warning",
        title:"Debut Granularity",
        text:"Please make the debut more specific."
      };
    }

  };

  return {
    "songs/compiled": entities,
    "songs/titles": titles,
    "songs/errors": errors,
    "songs/by-artist": artists.export(),
    "songs/by-genre": genres.export(),
    "songs/by-tag": tags.export(),
    "songs/by-playlist": playlists.export(),
    "songs/by-source": sources.export(),
    "songs/by-decade": decades.export(),
    "songs/by-year": years.export(),
    "songs/by-month": months.export(),
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

// // entities: array of entities of the type
// module.exports = function(yargs,entities) {
//   util.log(chalk.magenta("compile-song.js"));
//   var titles = {},...
//
//   // Processing pass.
//   entities.forEach(function(entity) {
//...
//
//
//
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
//
//   return {...}
// }
