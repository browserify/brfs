# brfs

browserify fs.readFileSync() static asset bundler

This module is a plugin for [browserify](http://browserify.org) to parse the AST
for `fs.readFileSync()` calls so that you can inline file contents into your
bundles.

# example

for a main.js:

``` js
var fs = require('fs');
var html = fs.readFileSync(__dirname + '/robot.html');
console.log(html);
```

and a robot.html:

``` html
<b>beep boop</b>
```

first `npm install brfs` into your project, then:

## on the command-line

```
$ browserify -t brfs example/main.js > bundle.js
```

## or with the api

``` js
var browserify = require('browserify');
var fs = require('fs');

var b = browserify('example/main.js');
b.transform('brfs');

b.bundle().pipe(fs.createWriteStream('bundle.js'));
```

# methods

brfs looks for `fs.readFileSync(pathExpr, enc='utf8')` calls.

The `pathExpr` function is evaluated as an expression with `__dirname` and
`__filename` variables available.

If you want differently-encoded file contents for your inline content you can
set `enc` to `'base64'` or `'hex'`.

# install

With [npm](https://npmjs.org) do:

```
npm install brfs
```

then use `-t brfs` with the browserify command or use `.transform('brfs')` from
the browserify api.

# license

MIT
