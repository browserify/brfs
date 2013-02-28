#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var brfs = require('./');
var file = process.argv[2];

var fromFile = file && file !== '-';
var rs = fromFile
    ? fs.createReadStream(file)
    : process.stdin
;

var fpath = fromFile ? file : path.join(process.cwd(), '-');
rs.pipe(brfs(fpath)).pipe(process.stdout);
rs.resume();
