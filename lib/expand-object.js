// Expand an object by finding its match in a collection 'all'
// and applying a transform function 'transform(entity,key,value)'.
module.exports = function(all,transform) {

  if (!all) return [];
  if (!transform) transform = titleTransform;

  var outbound = [];
  var _this = this;

  Object.keys(this).forEach(function(slug) {
    filtered = all.filter(function(genre) { return genre.instanceSlug === slug});
    if (filtered && filtered[0]) {
      outbound.push(transform(filtered[0],slug,_this[slug]));
    } else {
      outbound.push({slug:slug});
    }
  });

  return outbound;

};
