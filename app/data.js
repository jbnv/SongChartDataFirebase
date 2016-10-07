var Promise = require("firebase").Promise,
    isArray = require("is-array"),
    isFunction = require("is-function");

module.exports = function(firebase) {

  var db = firebase.database();

  function _rawRoute(typeSlug,instanceSlug) {
    return typeSlug+"/raw/"+instanceSlug;
  }
  function _indexRoute(typeSlug) {
    return typeSlug+"/index/"+instanceSlug;
  }
  function _compiledRoute(typeSlug,instanceSlug) {
    return typeSlug+"/compiled/"+instanceSlug;
  }
  function _chartRoute(typeSlug,instanceSlug) {
    return typeSlug+"/charts/"+instanceSlug;
  }

  function _getObject(groupSlug,typeSlug,instanceSlug,filter) {
    return db
      .ref(typeSlug+'/'+groupSlug+'/'+instanceSlug)
      .once('value')
      .then(function(snapshot) {
        var inbound = snapshot.val();
        if (isArray(filter)) {
          return filter.reduce(function(outbound,key) {
            outbound[key] = inbound[key];
            return outbound;
          },{});
        }
        // if (isFunction(filter)) {
        //   var outbound = {};
        //   for (var key in inbound) {
        //     if filter(inbound[key]) { outbound[key] = inbound[key]; }
        //   }
        //   return outbound;
        // }
        return inbound;
      });
  }

  function _getRawObject(typeSlug,instanceSlug) {
    return _getObject("raw",typeSlug,instanceSlug);
  }

  function _getCompiledObject(typeSlug,instanceSlug) {
    return _getObject("compiled",typeSlug,instanceSlug);
  }

  // options: {
  //  filterFn
  //  sortFn
  //  count
  //  page
  // }
  function _getCompiledCollection(typeSlug,options) {
    if (!typeSlug) throw "_getCompiledCollection: typeSlug is required!";
    return db.ref(typeSlug).child("compiled").once('value')
    .then(function(value) {

      if (!options) options = {};

      if (options.sortFn) {
        allItems = allItems.sort(options.sortFn);
      }

      var outbound = {
        "totalCount":allItems.length
      };

      var filteredItems = [];
      if (options.filterFn) {
        filteredItems = allItems.filter(options.filterFn);
        outbound.filteredCount = filteredItems.length;
      } else {
        filteredItems = allItems;
      }

      if (options.count) {
        var count = parseInt(options.count);
        var page =  parseInt(options.page || 1);
        outbound.filteredCount = count;
        outbound.pageSize = count;
        outbound.pageCount = Math.ceil(filteredItems.length/count);
        outbound.currentPage = page;
        outbound.items = filteredItems.slice(count*(page-1),count*page);
      } else {
        outbound.items = filteredItems;
      }

      return outbound;

    });
  }

  function _getTitles(typeSlug) {
    return db.ref(typeSlug).child("titles").once('value');
  }

  // list: list of slugs
  function _lookupEntities(list,typeSlug) {
    return Promise.all(list.map(function(slug) {
      return db.ref(typeSlug).child(slug).once('value');
    }));
  }

  function _expand(trueArray,route) {
    return db
      .ref(route+'/raw/')
      .once('value')
      .then(function(snapshot) {
        var data = snapshot.val();
        var outbound = {};
        for (var key in trueArray) {
          outbound[key] = data[key];
        }
        return outbound;
      });
  }

  function _byList(outbound,itemSlug,collection) {
    if (!outbound) outbound = {};
    if (collection) {
      for (var key in collection) {
        if (!outbound[key]) outbound[key] = {};
        outbound[key][itemSlug] = true;
      }
      return outbound;
    }

  }

  // inputs: { key: path }
  function _getBatch(inputs) {
    var promises = [];
    for (var keys in inputs) {
      promises.push(db.ref(inputs[keys]).once('value'));
    }
    return Promise.all(promises);
  }

  // outputs: { path: data }
  function _setBatch(outputs) {
    for (var path in outputs) {
      db.ref(path).set(outputs[path]);
    }
  }

  ////////////////////////////////////////////////////////////

  return {

    rawRoute: _rawRoute,
    compiledRoute: _compiledRoute,
    chartRoute: _chartRoute,
    getRawObject: _getRawObject,
    getCompiledObject: _getCompiledObject,
    getCompiledCollection: _getCompiledCollection,

    getArtists: _getCompiledObject("artist","all"),
    getArtistLists: _getCompiledObject("artist-list","all"),
    getGenres: _getCompiledObject("genre","all"),
    getLocations: _getCompiledObject("geo","all"),
    getPlaylists: _getCompiledObject("playlist","all"),
    getSources: _getCompiledObject("source","all"),
    getSongs: _getCompiledObject("song","all"),
    getTags: _getCompiledObject("tag","all"),

    getBatch: _getBatch,
    setBatch: _setBatch,

    lookupEntities: _lookupEntities,
    byList: _byList,
    expand: _expand

  }

}
