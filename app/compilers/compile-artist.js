var chalk       = require("chalk"),
    util        = require("gulp-util"),

    Entity      = require('firehash'),

    display     = require('../display'),
    scoring     = require('../scoring'),
    transform   = require('../transform'),

    argv        = require("yargs").argv;

require("../polyfill");

var _inputs = {
  "artists": "artists/raw",
  "songs": "songs/compiled",
  "songs-raw": "songs/raw",
  "tags": "tags/raw",
  "roles": "roles/raw",
  "genres": "genres/raw",
  "locations": "geo/raw",
  "song-median": "summary/songs/median"
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
      songMedian =  snapshot[7].val() || {},
      allArtistTypes = require("../models/artist-types") || {},

      songsBy = new Entity();

      entities = {},
      titles = {},
      errors = [],
      roles = new Entity(),
      genres = new Entity(),
      origins = new Entity(),
      tags = new Entity(),

      songMedianScore = scoring.score(songMedian);

  songsBy.extract("artists",allSongsRaw,function(x) { return true; });

  for (var slug in artists) {
    var entity = new Entity(artists[slug]);

    titles[slug] = entity.get("title");

    var songCount = 0;
    var totalPeak = 0.0;
    var totalAscent = 0.0;
    var totalDescent = 0.0;

    var entitySongs = {};
    for (var songSlug in songsBy.get(slug) || {}) {
      var song = allSongs[songSlug];
      var role = allSongsRaw[songSlug].artists[slug];
      var scoreFactor = scoring.scoreFactor(role);
      if (!song) continue;
      entitySongs[songSlug] = {
        title: song.title,
        role: role,
        scoreFactor: scoreFactor,
        totalScore: song.score,
        score: song.score * scoreFactor,
        peak: song.peak || null,
        debut: song.debut || null,
        "ascent-weeks": song["ascent-weeks"] || null,
        "descent-weeks": song["descent-weeks"] || null
      }
      songCount++;
      totalPeak += parseFloat(song.peak || 0);
      totalAscent += parseFloat(song["ascent-weeks"] || 0);
      totalDescent += parseFloat(song["descent-weeks"] || 0);
    }
    entitySongs = scoring.sortAndRank(entitySongs);
    entity.set("songs",entitySongs);

    if (songCount) {
      var expectedScore = songMedianScore * Math.sqrt(songCount);
      entity.set("average-peak",totalPeak/songCount);
      entity.set("average-ascent-weeks",totalAscent/songCount);
      entity.set("average-descent-weeks",totalDescent/songCount);
      entity.set("expected-score",expectedScore);

      var entityScorer = entity.get();
      scoring.scoreCollection.call(entityScorer);
      var artistScore = parseFloat(entityScorer.songAdjustedAverage);
      entity.set("score", artistScore);
      entity.set("trend", artistScore > expectedScore ? "leader" : artistScore < expectedScore ? "lagger" : "par");
    }

    var collaborators = new Entity();
    for (var songSlug in entity.get("songs")) {
      var songEntity = allSongs[songSlug] || {};
      for (var artistSlug in (songEntity.artists || {})) {
        if (artistSlug == slug) continue;
        collaborators.push(artistSlug,songSlug,songEntity);
      }
    }
    collaborators.forEach(function(artistSlug,artistEntity) {
      var artistSongsAsArray = [];
      for (var songSlug in (collaborators.get(artistSlug) || {})) {
        artistSongsAsArray.push(collaborators.get(artistSlug)[songSlug]);
      }
      var artist = artists[artistSlug] || {};
      var outbound = {
        title: artist.title || null,
        type: artist.type || null,
        roles: artist.roles || null,
        songCount: artistSongsAsArray.length,
        score: artistSongsAsArray.scoreAdjustedAverage()
      };
      entity.push("collaborators",artistSlug,outbound);
    });

    function _transformByList(typeSlug,aggregation,all) {
      aggregation.set(transform.byList(aggregation.get(),slug,entity.get(typeSlug)));
      entity.expand(typeSlug, all);
    }

    _transformByList("tags",tags,allTags);
    _transformByList("roles",roles,allRoles);
    _transformByList("genres",genres,allGenres);

    var origin = entity.get("origin");
    if (origin) {
      origins.push(origin,slug,true);
      entity.set("origin",allLocations[origin] || origin);
    }

    var typeSlug = entity.get("type");
    if (typeSlug) {
      entity.set("type",allArtistTypes[typeSlug]);
      entity.get("type").slug = typeSlug;
    }

    // Make a shallow copy to prevent circular references.
    function _shallow(artist) {
      return {
        title: (artist || {}).title || "UNKNOWN"
      };
    }

    entity.expand("members",artists,_shallow);
    entity.expand("xref",artists,_shallow);

    var trends = { leader: "🔵", lagger: "🔴", par: "⚫️" };

    if (argv.v || argv.verbose) {
      util.log(
        chalk.blue(slug),
        entity.title(),
        display.count(entity.get("songs")),
        display.number(entity.get("score")),
        trends[entity.get("trend")] || ""
      );
    }

    entities[slug] = entity.get();
    //entities[slug].score = entities[slug].score || 0; // make sure it isn't undefined

  }

  /* Calculate song rankings on all terms.*/

  util.log("Ranking by origin.");
  scoring.rankEntities(entities,origins.get(),"origin");

  util.log("Ranking by genre.");
  scoring.rankEntities(entities,genres.get(),"genre");

  util.log("Ranking by tag.");
  scoring.rankEntities(entities,tags.get(),"tag");

  util.log("Ranking by role.");
  scoring.rankEntities(entities,roles.get(),"role");

  util.log("Artist processing complete.");

  entities = scoring.sortAndRank(entities,transform.sortBySongAdjustedAverage);

  var scores = {};
  for (var slug in entities) {
    scores[slug] = entities[slug].score || null;
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
