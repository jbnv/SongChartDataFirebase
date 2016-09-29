var chalk       = require("chalk"),
    clone       = require("clone"),
    expandObject = require("../../lib/expand-object"),
    fs          = require("fs"),
    numeral     = require("numeral"),
    path        = require("path"),
    q           = require("q"),
    util        = require("gulp-util"),

    readEntity  = require("../../lib/fs").readEntity,
    lookupEntity = require("../../lib/fs").lookupEntity,
    lookupEntities = require("../../lib/fs").lookupEntities,

    Era         = require('../../lib/era'),
    EntityMap   = require('../../lib/entity-map'),
    meta        = require('../meta'),
    scoring     = require("../scoring"),
    transform   = require("../transform");

require("../polyfill");

function pushToCollection(collection,slug,entity) {
  if (!collection[slug]) collection[slug] = [];
  collection[slug].push(entity);
}

function transformArtist(artist,slug,roleSlug) {
  return {
    slug: slug,
    title: artist.title,
    type: artist.type,
    roleSlug: roleSlug,
    death: artist.death,
    tags: (artist.tags || [])
      .map(function(tag) { return (tag || {}).instanceSlug; })
      .filter(function(tag) { return tag; })
  };
}

// Validation before processing.
function prevalidate(song) {

  song.messages = [];
  var scores = song.scores || [];

  if (!song.peak) {
    song.messages.push({
      type:"warning",
      title:"Peak Not Set",
      text:"Peak set dynamically based on average of all scored songs."
    });
  }

  if (!song["ascent-weeks"]) {
    song.messages.push({
      type:"warning",
      title:"Ascent Not Set",
      text:"Ascent set dynamically based on average of all scored songs."
    });
  }

  if (!song["descent-weeks"]) {
    song.messages.push({
      type:"warning",
      title:"Descent Not Set",
      text:"Descent set dynamically based on average of all scored songs."
    });
  }

  if (!song.complete && song["descent-weeks"] > 13) {
    song.messages.push({
      type:"warning",
      title:"Long Descent",
      text:"Descent longer than 13 weeks. Adjust or confirm."
    });
  }

}

// Validation after processing.
function postvalidate(song) {

  if ((song.genres || []).length == 0) {
    song.messages.push({
      type:"warning",
      title:"Genre Not Set"
    });
  }

  if (!song.debut) {
    song.messages.push({
      type:"warning",
      title:"Debut Not Set"
    });
  }

  // Indicator: The "remake", "remix" or "sample" property is "true."
  if (song.remake && song.remake === true) {
    song.messages.push({
      type:"warning",
      title:"Remake Reference Not Set",
      text:"The 'remake' property is present and set to 'true'. Set to the referenced song."
    });
  }
  if (song.remix && song.remix === true) {
    song.messages.push({
      type:"warning",
      title:"Remix Reference Not Set",
      text:"The 'remix' property is present and set to 'true'. Set to the referenced song."
    });
  }
  if (song.sample && song.sample === true) {
    song.messages.push({
      type:"warning",
      title:"Sample Reference Not Set",
      text:"The 'sample' property is present and set to 'true'. Set to the referenced song."
    });
  }

  if (song.remake || song.remix || song.sample) {
    writers = (song.artists || []).filter(function(artist) {
      return artist.roleSlug === "writer";
    });
    if (writers.length < 1) {
      song.messages.push({
        type:"warning",
        title:"Writer Not Set",
        text:"This song has a property that indicates that the recording artist is not the writer. Please locate the writer."
      });
    }
  }

}

// entities: array of entities of the type
module.exports = function(yargs,entities) {
  util.log(chalk.magenta("compile-song.js"));

  allArtists = meta.getArtists();

  var titles = {},
      artists = {},
      genres = {},
      playlists = {},
      sources = new EntityMap(),
      decades = {},
      years = {},
      months = {},
      unscored = [],
      errors = [];

  var playlistDefs = {};
  fs.readdirSync(path.join(meta.root,"app","compilers","playlist"))
  .forEach(function(filename) {
    filenameTrunc = filename.replace(".js","");
    playlist = require("./playlist/"+filenameTrunc);
    playlistDefs[filenameTrunc] = playlist;
  });

  var peaks = [];
  var ascents = [];
  var descents = [];

  // Aggregation pass.
  entities.forEach(function(song) {

    if (song["peak"]) {
      peaks.push(song["peak"]);
    }

    if (song["ascent-weeks"]) {
      ascents.push(song["ascent-weeks"]);
    }

    if (song["descent-weeks"]) {
      descents.push(song["descent-weeks"]);
    }

  });

  var peaksSum = peaks.sum()
  var averagePeak = peaksSum/(2*peaks.length-peaksSum);
  var averageAscent = ascents.sum()/ascents.length;
  var averageDescent = descents.sum()/descents.length;

  // Processing pass.
  entities.forEach(function(entity) {
    if (entity.error) { errors.push(entity); return; }

    prevalidate(entity);

    var slug = entity.instanceSlug;
    if (!slug) return;

    entity.ranks = {};
    titles[entity.instanceSlug] = entity.title;

    entity.unscored = !entity["peak"];
    entity["peak"] = entity["peak"] || averagePeak;
    entity["ascent-weeks"] = entity["ascent-weeks"] || averageAscent;
    entity["descent-weeks"] = entity["descent-weeks"] || averageDescent;

    scoring.score(entity);

    if (entity.genre && !entity.genres) { entity.genres = [entity.genre]; }
    if (entity.genres && !Array.isArray(entity.genres)) { entity.genres = [entity.genres]; }
    if (entity.playlist && !entity.playlists) { entity.playlists = [entity.playlist]; }
    if (!entity.playlists) entity.playlists = [];
    if (entity.source && !entity.sources) { entity.sources = [entity.source]; }

    if (entity.artists) {
      for (var artistSlug in entity.artists) {
        var artist = entity.artists[artistSlug] || {};
        if (!artists[artistSlug]) artists[artistSlug] = [];
        var entityClone = clone(entity);
        delete entityClone.artists;
        entityClone.role = artist; //FUTURE artist.roleSlug;
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
        artists[artistSlug].push(entityClone);
      }
      entity.artists = expandObject.call(entity.artists,allArtists,transformArtist);
    } else {
       entity.artists = [];
    }

    if (entity.genres) {
      entity.genres.forEach(function(genreSlug) {
        if (!genres[genreSlug]) genres[genreSlug] = [];
        genres[genreSlug].push(entity);
      });
    }

    try {
      entity.genres = lookupEntities(entity.genres,"genre");
    } catch(err) {
      errors.push({"instanceSlug":slug,"stage":"genres","error":err});
    }

    if (entity.sources) {
      entity.sources.forEach(function(sourceSlug) {
        if (!sources[sourceSlug]) sources[sourceSlug] = [];
        sources[sourceSlug].push(entity);
      });
    }

    try {
      entity.sources = lookupEntities(entity.sources,"source");
    } catch(err) {
      errors.push({"instanceSlug":slug,"stage":"source","error":err});
    }

    if (entity.debut && entity.debut !== "") {
      var era = new Era(entity.debut);
      entity.debutEra = era.clone();
      if (era.decade) { pushToCollection(decades,""+era.decade+"s",entity); }
      if (era.year) { pushToCollection(years,era.year,entity); }
      //TEMP Month push needs to actually put the song in all months to which is is scoreed.
      if (era.month) {
        // Loop through the scores
        pushToCollection(months,entity.debut,entity);
      }
    }

    numeral.zeroFormat("");

    // Check against playlist rules.
    // This needs to happen after all other processing takes place.

    Object.keys(playlistDefs).forEach(function(key) {
      var playlist = playlistDefs[key];
      if (playlist.match(entity)) entity.playlists.push(key);
    });

    if (entity.playlists) {
      entity.playlists.forEach(function(playlistSlug) {
        if (!playlists[playlistSlug]) playlists[playlistSlug] = [];
        playlists[playlistSlug].push(entity);
      });
    }

    try {
      entity.playlists = lookupEntities(entity.playlists,"playlist");
    } catch(err) {
      errors.push({"instanceSlug":slug,"stage":"playlists","error":err});
    }

    postvalidate(entity);

    // util.log(
    //   chalk.blue(entity.instanceSlug),
    //   entity.title,
    //   chalk.gray(numeral(entity.score).format("0.00"))
    // );

  });

  /* Calculate song rankings on all terms.*/

  util.log("Ranking by artist.");
  scoring.rankEntities(entities,artists,"artist");

  util.log("Ranking by genre.");
  scoring.rankEntities(entities,genres,"genre");

  util.log("Ranking by playlist.");
  scoring.rankEntities(entities,playlists,"playlist");

  util.log("Ranking by source.");
  scoring.rankEntities(entities,sources,"source");

  util.log("Ranking by decade.");
  scoring.rankEntities(entities,decades,"decade");

  util.log("Ranking by year.");
  scoring.rankEntities(entities,years,"year");

  // months = {},

  util.log("Song processing complete.");

  entities = scoring.sortAndRank(entities);

  entities.forEach(function(song) {

    if (song.rank && (song.rank <= 100) && !song.complete) {
      song.messages.push({
        type:"warning",
        title:"Incomplete",
        text:"This song has a high ranking but is not marked as complete. May need a writer and/or producer."
      });
    }

    var debutType = (song.debutEra || {}).type || "";

    if (
      song.rank && (song.rank <= 100)
      && (!/^((month)|(day))$/.test(debutType))
    ) {
      song.messages.push({
        type:"warning",
        title:"Debut Granularity",
        text:"Please make the debut more specific."
      });
    } else if (
      song.rank && (song.rank <= 1000)
      && (!/^((year)|(month)|(day))$/.test(debutType))
    ) {
      song.messages.push({
        type:"warning",
        title:"Debut Granularity",
        text:"Please make the debut more specific."
      });
    }


  });

  return {
    "all": entities,
    "titles": titles,
    "by-artist": artists,
    "by-genre": genres,
    "by-playlist": playlists,
    "by-source": sources,
    "by-decade": decades,
    "by-year": years,
    "by-month": months,
    "unscored": unscored,
    "errors":errors
  }
}
