var scoring = require("../app/scoring");

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
