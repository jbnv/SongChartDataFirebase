var scoring = require("../app/scoring");

describe("score()", function() {

  it("scores from literal parameters", function() {
    expect(scoring.score()).toEqual(0);
    expect(scoring.score(0.3)).toEqual(0);
    expect(scoring.score(0.3,1)).toBeCloseTo(0.2,3);
    expect(scoring.score(0.3,1,1)).toBeCloseTo(0.4,3);
  });

  it("scores from an object, even if object is incomplete", function() {
    expect(scoring.score({})).toEqual(0);
    expect(scoring.score({peak:1})).toBeCloseTo(scoring.score(1),3);
    expect(scoring.score({"ascent-weeks":1})).toBeCloseTo(scoring.score(0,1),3);
    expect(scoring.score({"descent-weeks":1})).toBeCloseTo(scoring.score(0,0,1),3);
    expect(scoring.score({peak:1,"ascent-weeks":1})).toBeCloseTo(scoring.score(1,1),3);
    expect(scoring.score({peak:1,"descent-weeks":1})).toBeCloseTo(scoring.score(1,0,1),3);
    expect(scoring.score({peak:1,"ascent-weeks":1,"descent-weeks":1})).toBeCloseTo(scoring.score(1,1,1),3);
  });

});

describe("bend()()", function() {

  it("returns a higher value for higher coefficient", function() {
    expect(scoring.bend(1)(0.5)).toBeGreaterThan(scoring.bend(0.5)(0.5));
  });

  it("returns a lower value for lower coefficient", function() {
    expect(scoring.bend(-1)(0.5)).toBeLessThan(scoring.bend(-0.5)(0.5));
  });

});

describe("up() (bend(1)())", function() {

  it("returns 0 for 0", function() {
    expect(scoring.up(0)).toEqual(0);
  });

  it("returns 1 for 1", function() {
    expect(scoring.up(1)).toEqual(1);
  });

  it("increases numbers between 0 and 1", function() {
    expect(scoring.up(0.25)).toBeGreaterThan(0.25);
    expect(scoring.up(0.50)).toBeGreaterThan(0.50);
    expect(scoring.up(0.75)).toBeGreaterThan(0.75);
  });

});

describe("down() (bend(-1)())", function() {

  it("returns 0 for 0", function() {
    expect(scoring.down(0)).toEqual(0);
  });

  it("returns 1 for 1", function() {
    expect(scoring.down(1)).toEqual(1);
  });

  it("decreases numbers between 0 and 1", function() {
    expect(scoring.down(0.25)).toBeLessThan(0.25);
    expect(scoring.down(0.50)).toBeLessThan(0.50);
    expect(scoring.down(0.75)).toBeLessThan(0.75);
  });

});

describe("swap()", function() {

  it("swaps the scores of two objects", function() {

    blah = {peak: 1, "ascent-weeks": 1, "descent-weeks": 4};
    yada = {peak: 1, "ascent-weeks": 1, "descent-weeks": 5.5};
    swapped = scoring.swap(blah,yada);

    expect(swapped[0]).toEqual({peak: 1, "ascent-weeks": 1, "descent-weeks": 5.5});
    expect(swapped[1]).toEqual({peak: 1, "ascent-weeks": 1, "descent-weeks": 4});

  });

  it("swaps the scores of two objects", function() {

    blah = {peak: 1, "ascent-weeks": 1, "descent-weeks": 5}; // score = 4
    yada = {peak: 0.5, "ascent-weeks": 1, "descent-weeks": 14}; // score = 5
    swapped = scoring.swap(blah,yada);

    expect(swapped[0]).toEqual({peak: 1, "ascent-weeks": 1, "descent-weeks": 6.5});
    expect(swapped[1]).toEqual({peak: 0.5, "ascent-weeks": 1, "descent-weeks": 11});

  });

});

describe("cumulativeScore()", function() {

  const ascentWeeks = 3, descentWeeks = 5;
  const song = {"peak":1, "ascent-weeks": ascentWeeks, "descent-weeks": descentWeeks};

  it("returns 0 for no parameters", function() {
    expect(scoring.cumulativeScore()).toEqual(0);
  });

  it("returns 1 if only a song specified", function() {
    expect(scoring.cumulativeScore(song)).toEqual(0);
  });

  it("returns gradually-increasing values", function() {
    expect(scoring.cumulativeScore(song,ascentWeeks/3)).toBeGreaterThan(scoring.cumulativeScore(song,0));
    expect(scoring.cumulativeScore(song,ascentWeeks)).toBeGreaterThan(scoring.cumulativeScore(song,ascentWeeks/3));
    expect(scoring.cumulativeScore(song,ascentWeeks+descentWeeks)).toBeGreaterThan(scoring.cumulativeScore(song,ascentWeeks));
  });

  it("equals score() at the end of the period", function() {
    expect(scoring.cumulativeScore(song,ascentWeeks+descentWeeks))
    .toBeCloseTo(scoring.score(song));
  });

  it("returns the same value after the end of the period", function() {
    expect(scoring.cumulativeScore(song,ascentWeeks+descentWeeks+1))
    .toEqual(scoring.cumulativeScore(song,ascentWeeks+descentWeeks));
  });

});

describe("scoreForSpan()", function() {

  const ascentWeeks = 3, descentWeeks = 5;
  const song = {"peak":1, "ascent-weeks": ascentWeeks, "descent-weeks": descentWeeks};

  const
    halfAscent = ascentWeeks/2,
    peak = ascentWeeks,
    halfDescent = ascentWeeks + descentWeeks/2,
    fullDescent = ascentWeeks + descentWeeks;

  it("returns gradually-increasing values on the ascent", function() {
    expect(scoring.scoreForSpan(song,0,halfAscent))
    .toBeLessThan(scoring.scoreForSpan(song,halfAscent,peak));
  });

  it("returns gradually-decreasing values on the descent", function() {
    expect(scoring.scoreForSpan(song,peak,halfDescent))
    .toBeGreaterThan(scoring.scoreForSpan(song,halfDescent,fullDescent));
  });

  it("returns the greatest value at the peak", function() {

    var atPeak = scoring.scoreForSpan(song,peak-0.5,peak+0.5);
    var duringAscent = scoring.scoreForSpan(song,halfAscent-0.5,halfAscent+0.5);
    var duringDescent = scoring.scoreForSpan(song,halfDescent-0.5,halfDescent+0.5);

    expect(atPeak).toBeGreaterThan(duringAscent);
    expect(atPeak).toBeGreaterThan(duringDescent);
  });

  it("returns 0 for spans outside of the range", function() {
    expect(scoring.scoreForSpan(song,-1,0)).toEqual(0);
    expect(scoring.scoreForSpan(song,ascentWeeks+descentWeeks,ascentWeeks+descentWeeks+1)).toEqual(0);
  });

});
