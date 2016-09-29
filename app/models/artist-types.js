var _types = [
  {"slug":"","title":"Not Set/Unknown",},
  {"slug":"u","title":"Unrecognized",},
  {"slug":"f","title":"Solo Female"},
  {"slug":"m","title":"Solo Male"},
  {"slug":"d","title":"Duo (deprecated)"},
  {"slug":"g","title":"Group (deprecated)"},
  {"slug":"mm","title":"Male Duo"},
  {"slug":"ff","title":"Female Duo"},
  {"slug":"mf","title":"Mixed Duo, Male Lead"},
  {"slug":"fm","title":"Mixed Duo, Female Lead"},
  {"slug":"mmm","title":"All-Male Group"},
  {"slug":"mmf","title":"Mixed Group, Male Lead"},
  {"slug":"mff","title":"Mixed Group, Male Lead"},
  {"slug":"fmm","title":"Mixed Group, Female Lead"},
  {"slug":"ffm","title":"Mixed Group, Female Lead"},
  {"slug":"fff","title":"All-Female Group"}
];

var outbound = {};

_types.forEach(function(type) {
  outbound[type.slug] = {
    "title":type.title,
    "artists":[],
    "artistCount":0,
    "score":0.00,
    "artistAdjustedAverage":0.00
  };
});

module.exports = outbound;
