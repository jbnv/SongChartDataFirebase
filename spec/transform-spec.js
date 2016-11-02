var _transform = require("../app/transform");

describe("objectToArray()", function() {

  var sampleObject = { blah: 1, yada: 2, hoot: 3 }

  it("converts an object into an array", function() {
    expect(_transform.objectToArray(sampleObject))
    .toEqual([
      { __value: 1, __key: 'blah', __rank: 1, __rankCount: 3 },
      { __value: 2, __key: 'yada', __rank: 2, __rankCount: 3 },
      { __value: 3, __key: 'hoot', __rank: 3, __rankCount: 3 }
    ]);
  });

});
