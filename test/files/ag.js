var fs = require('fs');
var pre = fs.readFileSync(__dirname + '/ag_pre.html');
var post = fs.readFileSync(__dirname + '/ag_post.html');
var ag = require('./ag.json');
console.log(pre + Object.keys(ag).sort().join('') + post);
