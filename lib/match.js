// Returns a boolean if any of the followng are true:
// - Subject and Obejct are both scalars and match identically.
// - Subject is a scalar and Object is a RegExp and subject matches regexp.
// - Subject is a scalar and Object is an array and Subject matches any in Object.
// - Subject is a scalar and Object is a true-array  and Subject matches any in Object.
// - Subject is an array and any item in Subject matches Object.
// - Subject is a true-array  and any item in Subject matches Object.

function _match(subject,object) {
  //console.log("match [10]",typeof subject,typeof object); //TEMP

  if (!subject || !object) {
    //console.log("match [12] Either subject or object is null."); //TEMP
    return false;
  }

  if (subject === true) {
    //console.log("match [18] Subject === true."); //TEMP
    return true;
  }

  if (object === true) {
    //console.log("match [23] Object === true."); //TEMP
    return true
  }

  if (typeof subject === "function") {
    //console.log("match [28] Subject is a function."); //TEMP
    return subject(object);
  }

  if (typeof object === "function") {
    //console.log("match [30] Object is a function."); //TEMP
    return object(subject);
  }

  if (/number|string/.test(typeof subject)) {

    if (/number|string/.test(typeof object)) {
      //console.log("match [32] scalars |",subject,object); //TEMP
      return subject === object;
    }

    if (object instanceof RegExp) {
      //console.log("match [34] scalar to RegExp |",subject,object); //TEMP
      return object.test(subject);
    }

    if (Array.isArray(object)) {
      //console.log("match [36] scalar to Array |",subject,object); //TEMP
      return subject.reduce(function (prev,cur) {
        return prev || _match(subject,cur);
      },false);
    }

    //console.log("match [40] scalar to Object |",subject,object); //TEMP
    return Object.keys(object).reduce(function (prev,cur) {
      return prev || _match(subject,cur);
    },false);

  }

  if (Array.isArray(subject)) {
    //console.log("match [44] Array to something |",subject,object);
    return subject.reduce(function (prev,cur) {
      return prev || _match(cur,object);
    },false);
  }

  //console.log("match [51] Object to something |",subject,object);
  return Object.keys(subject).reduce(function (prev,cur) {
    return prev || _match(cur,object);
  },false);

}

module.exports = _match;
