var chalk       = require("chalk"),
    numeral     = require("numeral");

numeral.zeroFormat("");

function _wholeNumber(n) {
  return chalk.gray(numeral(n || 0).format("0"));
}

function _number(n) {
  return chalk.gray(numeral(n || 0).format("0.00"));
}

exports.number = _number;

exports.wholeNumber = _wholeNumber;

exports.count = function(obj) {
  return _wholeNumber(
    function(o) {
      if (!obj) return 0;
      if (/boolean|number|string/.test(typeof obj)) return 1;
      if (Array.isArray(obj)) return obj.length;
      return Object.keys(obj).length;
    }(obj)
  );
}
