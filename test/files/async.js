var fs = require('fs');
fs.readFile(__dirname + '/async.txt', function (err, txt) {
    console.log(txt);
});
