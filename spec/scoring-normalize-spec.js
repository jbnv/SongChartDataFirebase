var scoring = require("../app/scoring");

function _expectMatch(result,original) {
  expect(result.peak).toEqual(original.peak);
  expect(result["ascent-weeks"]).toEqual(original["ascent-weeks"]);
  expect(result["descent-weeks"]).toEqual(original["descent-weeks"]);
}

describe("normalize() on no songs", function() {

  var normalizedSongs = scoring.normalize({});

  it("returns empty set", function() {
    expect(normalizedSongs).toEqual({});
  });

});

describe("normalize() on one valid song", function() {

  var songs = {
    "maxo": { peak: 1, "ascent-weeks": 1, "descent-weeks": 5}, // score = 4
  }

  var normalizedSongs = scoring.normalize(songs);

  it("returns the valid song, unaltered", function() {
    _expectMatch(normalizedSongs.maxo,songs.maxo);
  });

});

describe("normalize() on one song without peak", function() {

  var songs = {
    "nopeak": { "ascent-weeks": 1, "descent-weeks": 5}, // score = 4
  }

  var normalizedSongs = scoring.normalize(songs);

  it("returns empty set", function() {
    expect(normalizedSongs).toEqual({});
  });

});

describe("normalize() on one song without ascent", function() {

  var songs = {
    "noascent": { peak: 1,  "descent-weeks": 5}, // score = 4
  }

  var normalizedSongs = scoring.normalize(songs);

  it("returns the one row, unaltered", function() {
    expect(normalizedSongs).toEqual({});
  });

});

describe("normalize() on two songs", function() {

  var songs = {
    "maxo": { peak: 1, "ascent-weeks": 1, "descent-weeks": 5}, // score = 4
    "mino": { peak: 0.2, "ascent-weeks": 1, "descent-weeks": 4}
  }

  var normalizedSongs = scoring.normalize(songs);

  it("returns the songs, unaltered", function() {
    _expectMatch(normalizedSongs.maxo,songs.maxo);
    _expectMatch(normalizedSongs.mino,songs.mino);
  });

});

describe("normalize() on more than two songs", function() {

  var songs = {
    "maxo": { peak: 1, "ascent-weeks": 1, "descent-weeks": 5}, // score = 4
    "mid1": { peak: 0.8, "ascent-weeks": 1, "descent-weeks": 5}, // score = 3.2
    "mid2": { peak: 1, "ascent-weeks": 1, "descent-weeks": 3.65}, // score = 3.1
    "mid3": { peak: 0.8, "ascent-weeks": 1, "descent-weeks": 4.625}, // score = 3
    "mino": { peak: 0.2, "ascent-weeks": 1, "descent-weeks": 4},
    "nopeak": { "ascent-weeks": 1, "descent-weeks": 4}, // should ignore
    "noascent": { peak: 0.2, "descent-weeks": 4} // should ignore
  }

  var normalizedSongs = scoring.normalize(songs);

  it("preserves the maximum", function() {
    _expectMatch(normalizedSongs.maxo,songs.maxo);
  });

  it("preserves the minimum", function() {
    _expectMatch(normalizedSongs.mino,songs.mino);
  });

  it("keeps the peaks in order by total score", function() {
    expect(normalizedSongs.maxo.peak).toBeGreaterThan(normalizedSongs.mid1.peak);
    expect(normalizedSongs.mid1.peak).toBeGreaterThan(normalizedSongs.mid2.peak);
    expect(normalizedSongs.mid2.peak).toBeGreaterThan(normalizedSongs.mid3.peak);
    expect(normalizedSongs.mid3.peak).toBeGreaterThan(normalizedSongs.mino.peak);
  });

  it("preserves the scores of all songs", function() {
    for (slug in songs) {
      var normalizedSong = normalizedSongs[slug];
      if (normalizedSong) {
        expect(normalizedSong.score).toBeCloseTo(scoring.score(songs[slug]));
      }
    }
  });

});
