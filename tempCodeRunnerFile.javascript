
let _ = require('lodash');

let emptyArray = [] + {};

console.log(emptyArray);
console.log(_.isArray(emptyArray).toString());
console.log(typeof emptyArray);
