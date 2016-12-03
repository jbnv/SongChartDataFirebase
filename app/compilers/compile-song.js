var chalk       = require("chalk"),
    fs          = require("fs"),
    path        = require("path"),
    util        = require("gulp-util"),
    numeral     = require("numeral"),

    Entity      = require('firehash'),
    Era         = require('gregoria'),
    _match       = require('supermatch'),

    display     = require('../display'),
    scoring     = require('../scoring'),
    transform   = require('../transform'),

    argv        = require("yargs").argv;

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

  var song = songEntity.get(), messages = {}

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
    averageDescent: descents.sum()/descents.length,
    medianPeak: peaks.median(),
    medianAscent: ascents.median(),
    medianDescent: descents.median()
  };

}

// Returns true or false if the song matches this particular playlist.
function _playlistMatch(playlist,song) {
  var slug = playlist.slug;
  var reducer = playlist.reducer;
  var filter = playlist.filter;

  // Custom reducer?
  if (reducer === true) {
    return require("./playlist/"+slug).match(song);
  }

  // General reducer?
  if (reducer) {
    return require("../reducers/"+reducer)(slug)(song);
  }

  // Filter?
  if (filter) {
    var matchesAll = true;
    for (var field in filter) {
      var songField = song[field];
      var filterField = filter[field];
      if (typeof filterField === "string") filterField = new RegExp(filterField);
      var isMatch = _match(songField,filterField);
      matchesAll = matchesAll && isMatch;
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
      allGenres = snapshot[5].val() || {},
      allSources = snapshot[6].val() || {},

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

    titles[slug] = entity.title();
    entity.messages = {};

    var prevalidateMessages = _prevalidate(slug,entity) || {};
    entity.addMessage(prevalidateMessages);

    entity.set("unscored",!entity.get("peak"));

    entity.setDefault("peak",aggregates.averagePeak);
    entity.setDefault("ascent-weeks",aggregates.averageAscent);
    entity.setDefault("descent-weeks",aggregates.averageDescent);

    var songScored = scoring.scoreSong(entity.get());
    entity.set("score",songScored.score);
    entity.set("duration",songScored.duration);

    // Map singular fields to corresponding plurals.
    entity.fix("genre","genres");
    entity.fix("playlist","playlists");
    entity.fix("source","sources");

    var songArtists = entity.get("artists") || {};
    for (var artistSlug in songArtists) {

      var artist = allArtists[artistSlug] || {};
      var artistRole = songArtists[artistSlug] || {};

      var scoreFactor = artist.scoreFactor || scoring.scoreFactor(artistRole);
      var entityClone = {
        role: artistRole, //FUTURE artist.roleSlug;
        scoreFactor: scoreFactor,
        totalScore: songScored.score || null,
        score: (songScored.score || 0) * (scoreFactor || 0)
      };

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

    if (argv.v || argv.verbose) {
      util.log(
        chalk.blue(slug),
        entity.title(),
        display.number(entity.get("score"))
      );
    }

    entities[slug] = entity.get();
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

  /* Calculate song rankings on all terms.*/

  util.log("Ranking by artist.");
  scoring.rankEntities(entities,artists.get(),"artist");

  util.log("Ranking by genre.");
  scoring.rankEntities(entities,genres.get(),"genre");

  util.log("Ranking by playlist.");
  scoring.rankEntities(entities,playlists.get(),"playlist");

  util.log("Ranking by source.");
  scoring.rankEntities(entities,sources.get(),"source");

  util.log("Ranking by decade.");
  scoring.rankEntities(entities,decades.get(),"decade");

  util.log("Ranking by year.");
  scoring.rankEntities(entities,years.get(),"year");

  util.log("Ranking all.");
  scoring.rankEntities(entities);

  function _processSongs(slug,songs) {
    var songsExpanded = new Entity(songs);
    var era = new Era(slug);
    era.songs = songsExpanded.map(function(songSlug) {
      return entities[songSlug];
    });
    scoring.scoreCollection.call(era);
    return {count: era.songCount, score: era.songAdjustedAverage};
  }

  util.log("Summarizing decades.");
  var decadesSummary = transform.aggregateEra(decades.map(_processSongs));

  util.log("Summarizing years.");
  var yearsSummary = transform.aggregateEra(years.map(_processSongs));

  util.log("Collecting scores.");
  var scores = {};
  for (var slug in entities) {
    scores[slug] = entities[slug].score;
  }
  return {
    "songs/compiled": entities,
    "songs/titles": titles,
    "songs/scores": scores,
    "songs/errors": errors,
    "songs/by-artist": artists.get(),
    "songs/by-genre": genres.get(),
    "songs/by-tag": tags.get(),
    "songs/by-playlist": playlists.get(),
    "songs/by-source": sources.get(),
    "songs/by-decade": decades.get(),
    "songs/by-year": years.get(),
    "songs/by-month": months.get(),
    "songs/unscored": unscored,
    "summary/songs": {
      "count": Object.keys(entities).length,
      "average":{
        "peak": aggregates.averagePeak,
        "ascent-weeks": aggregates.averageAscent,
        "descent-weeks": aggregates.averageDescent,
      },
      "median":{
        "peak": aggregates.medianPeak,
        "ascent-weeks": aggregates.medianAscent,
        "descent-weeks": aggregates.medianDescent,
      }
    },
    "summary/decades": decadesSummary,
    "summary/years": yearsSummary
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
