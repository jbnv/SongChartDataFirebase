var chalk       = require("chalk"),
    numeral     = require("numeral");

numeral.zeroFormat("");

function _chooseColor(options) {
  if (!options) return "gray";
  if (options == "error") return "red";
  if (options == "warning") return "yellow";
  if (options.isError) return "red";
  if (options.isWarning) return "yellow";
  return "gray";
}

function _wholeNumber(n,options) {
  if (!options) options = {};
  var color = _chooseColor(options);
  return chalk[color](numeral(n || 0).format("0") + (options.isCalculated ? "⎰" : ""));
}

function _number(n,options) {
  if (!options) options = {};
  var color = _chooseColor(options);
  return chalk[color](numeral(n || 0).format("0.00") + (options.isCalculated ? "⎰" : ""));
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
