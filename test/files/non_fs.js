var blarg = require('fs');
var html = blarg.readFileSync(__dirname + '/robot.html');
console.log(html);
