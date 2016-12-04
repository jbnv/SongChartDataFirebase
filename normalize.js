require("./app/transform-batch")({
  transformFn: require('./app/scoring').normalize
});
