var fs = require('fs');
fs.readFile(__dirname + '/robot.html', function (err, html) {
    console.log(html);
});
