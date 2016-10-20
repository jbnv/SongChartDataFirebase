// scalar: set one field
// function: transform target
// array: set more than one field
// object: set
function _set(key,value) {
  if (!key) return;
  if (/boolean|number|string/.test(typeof key)) {
    this[key] = value || true;
    return;
  };
  if (typeof key == "function") {
    key(this,value);
    return;
  }
  if (Array.isArray(key)) {
    key.forEach(function(subkey) { this[subkey] =  value || true; })
    return;
  }
  for (var subkey in key) {
    this[subkey] = value;
  }
}

// scalar: get one field
// function: ?
// array: get more than one field
// object: ?
function _get(key) {
  if (!key) return;
  if (/boolean|number|string/.test(typeof key)) {
    return this[key];
  };
  if (typeof key == "function") {
  //   key(this,value);
    return null;
  }
  if (Array.isArray(key)) {
    return key.map(function(subkey) { return this[subkey]; })
    return;
  }
  var outbound = {};
  for (var subkey in key) {
    outbound[subkey] = this[subkey];
  }
  return outbound;
}

function _log(data) {
  if (this.__debug) this.__messages[new Date().getTime()] = data;
}

function _push(level1,level2,entity) {

  if (!level1 || !level2 || !entity) return;

  if (!this.__data[level1]) this.__data[level1] = {};
  _set.call(this.__data[level1],level2,entity);
  _log.call(this,{
    method: "push",
    level1: level1,
    level2: level2,
    entity: entity
  })
}

////////////////////////////////////////////////////////////////////////////////

function _import() {
  var _data = this.__data;
  Array.from(arguments).forEach(function(data) {
    if (/boolean|number|string/.test(typeof data)) {
      _data[data] = true;
      return;
    };
    if (typeof data == "function") {
      data(_data,true);
      return;
    }
    if (Array.isArray(data)) {
      data.forEach(function(datum) { _data[datum] = true; })
      return;
    }
    for (var key in data) {
      _data[key] = data[key];
    }
  });
}

function _importMessages() {
  var _messages = this.__messages;
  Array.from(arguments).forEach(function(data) {
    if (/boolean|number|string/.test(typeof data)) {
      _messages[data] = true;
      return;
    };
    if (typeof data == "function") {
      data(_messages,true);
      return;
    }
    if (Array.isArray(data)) {
      data.forEach(function(datum) { _messages[datum] = true; })
      return;
    }
    for (var key in data) {
      _messages[key] = data[key];
    }
  });
}

////////////////////////////////////////////////////////////////////////////////

function _Entity(data,name,debug) {
  this.__data = {};
  this.__messages = {};
  this.__name = name || null;
  this.__debug = debug || false;
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

_Entity.prototype.keys = function() {
  return Object.keys(this.__data);
}

_Entity.prototype.keyCount = function() {
  return Object.keys(this.__data).length;
}

_Entity.prototype.push = _push;

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

// Browse a collection and extract all data from a certain field.
_Entity.prototype.extract = function(fieldSlug,collection,transformFn) {

  if (!fieldSlug) return null;
  if (!collection) return null;
  if (!transformFn) transformFn = function(entity) { return entity; };

  for (var collectionKey in collection) {
    var entity = collection[collectionKey];
    var field = entity[fieldSlug];
    var entityTransformed = transformFn(entity);
    if (!field) continue;
    if (/boolean|string|number/.test(typeof field)) {
      _push.call(this,field,collectionKey,entityTransformed);
      continue;
    }
    if (Array.isArray(field)) {
      field.forEach(function(fieldKey) {
        _push.call(this,fieldKey,collectionKey,entityTransformed);
      })
    }
    for (var fieldKey in field || {}) {
      _push.call(this,fieldKey,collectionKey,entityTransformed);
    }
  }
}

////////////////////////////////////////////////////////////////////////////////
// Collection functions.

// callback: function(key,value)
_Entity.prototype.forEach = function(callback) {
  for (var key in this.__data) callback(key,this.__data[key]);
}

// callback: function(key,value)
_Entity.prototype.map = function(callback) {
  var outbound = {};
  for (var key in this.__data) outbound[key] = callback(key,this.__data[key]);
  return outbound;
}

//TODO reduce()

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
