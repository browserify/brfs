var fs,
    path,
    dynamicallyCreatedFilename;
fs = require('fs');
path = require('path');

dynamicallyCreatedFilename = path.join('/files/', 'somefile');
var stuff = fs.readFileSync(__dirname + dynamicallyCreatedFilename + __dirname);
