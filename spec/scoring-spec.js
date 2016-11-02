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
