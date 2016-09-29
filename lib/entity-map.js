function EntityMap() { }

EntityMap.prototype.push = function(slug,entity) {
  if (slug) {
    if (!this[slug]) this[slug] = [];
    this[slug].push(entity);
  }
};

module.exports = EntityMap;
