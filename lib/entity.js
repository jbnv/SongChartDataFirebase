function _import() {
  var entity = this.__data;
  Array.from(arguments).forEach(function(data) {
    if (!data) return;
    if (/boolean|number|string/.test(typeof data)) {
      entity[data] = true;
      return;
    };
    if (Array.isArray(data)) {
      data.forEach(function(datum) { entity[datum] =  true; })
      return;
    }
    for (var key in data) {
      entity[key] = data[key];
    }
  });
}

function _importMessages() {
  var thisMessages = this.__messages;
  Array.from(arguments).forEach(function(argument) {
    if (!argument) return;
    if (/boolean|number|string/.test(typeof argument)) {
      thisMessages[data] = true;
      return;
    };
    if (Array.isArray(argument)) {
      argument.forEach(_importMessages);
      return;
    }
    for (var key in argument) {
      thisMessages[key] = argument[key];
    }
  });
}

////////////////////////////////////////////////////////////////////////////////

function _Entity(data) {
  this.__data = {};
  this.__messages = {};
  _import.call(this,data);
}

// path: Either a key to a value or an array of nested keys.
_Entity.prototype.get = function(path) {
  if (!path) return null;
  if (/boolean|number|string/.test(typeof path)) return this.__data[path];
  //TODO return path.reduce(function )
  return null;
}

_Entity.prototype.set = function(path,value) {
  if (!path) return null;
  if (/boolean|number|string/.test(typeof path)) {
    this.__data[path] = value;
    return value;
  }
  //TODO return path.reduce(function )
  return null;
}

// Set the field to the given value only if it is not already set.
_Entity.prototype.setDefault = function(path,value) {
  if (!path) return null;
  if (/boolean|number|string/.test(typeof path)) {
    if (!this.__data[path]) this.__data[path] = value;
    return this.__data[path];
  }
  //TODO return path.reduce(function )
  return null;
}

_Entity.prototype.import = _import;

_Entity.prototype.export = function() {
  var outbound = {};
  for (var key in this.__data) {
    outbound[key] = this.__data[key];
  }
  return outbound;
}

_Entity.prototype.push = function(listSlug,entitySlug,entity) {

  if (!listSlug) return;
  if (!entitySlug) return;
  if (!entity) return;

  if (!this.__data[listSlug]) this.__data[listSlug] = {};
  this.__data[listSlug][entitySlug] = entity;

};

_Entity.prototype.fix = function(singular,plural) {

  var singularValue = this.__data[singular], pluralValue = this.__data[plural];

  if (singularValue && !pluralValue) {
    this.__data[plural] = {};
    this.__data[plural][singularValue] = true;
    return;
  }

  if (!pluralValue) {
    this.__data[plural] = {};
    return;
  }

  if (/boolean|number|string/.test(typeof pluralValue)) {
    this.__data[plural] = {};
    this.__data[plural][pluralValue] = true;
  };

}

////////////////////////////////////////////////////////////////////////////////
// messages

_Entity.prototype.messages = function() {
  return this.__messages;
}

_Entity.prototype.addMessage = _importMessages;

////////////////////////////////////////////////////////////////////////////////
// Data fields

_Entity.prototype.title =  function() {
  return this.__data.title || "TITLE NOT SET";
}

////////////////////////////////////////////////////////////////////////////////

module.exports = _Entity;
