var staticModule = require('static-module');
var quote = require('quote-stream');
var through = require('through2');
var fs = require('fs');
var path = require('path');

module.exports = function (file) {
    if (/\.json$/.test(file)) return through();
    var vars = {
        __filename: file,
        __dirname: path.dirname(file)
    };
    var sm = staticModule(
        { fs: { readFileSync: readFileSync, readFile: readFile } },
        { vars: vars }
    );
    return sm;
    
    function readFile (file, enc, cb) {
        if (typeof enc === 'function') {
            cb = enc;
            enc = null;
        }
        if (enc && typeof enc === 'object' && enc.encoding) {
            enc = enc.encoding;
        }
        var isBuffer = false;
        if (enc === null || enc === undefined) {
            isBuffer = true;
            enc = 'base64';
        }
        
        var stream = through(write, end);
        stream.push('process.nextTick(function(){(' + cb + ')(null,');
        if (isBuffer) stream.push('Buffer(');
        
        var s = fs.createReadStream(file, { encoding: enc });
        s.on('error', function (err) { sm.emit('error', err) });
        return s.pipe(quote()).pipe(stream);
        
        function write (buf, enc, next) {
            this.push(buf);
            next();
        }
        function end (next) {
            if (isBuffer) this.push(',"base64")');
            this.push(')})');
            this.push(null);
            next()
        }
    }
    
    function readFileSync (file, enc) {
        var isBuffer = false;
        if (enc === null || enc === undefined) {
            isBuffer = true;
            enc = 'base64';
        }
        if (enc && typeof enc === 'object' && enc.encoding) {
            enc = enc.encoding;
        }
        var q = fs.createReadStream(file,  { encoding: enc }).pipe(quote());
        if (isBuffer) {
            var stream = through(write, end);
            stream.push('Buffer(');
            return q.pipe(stream);
        }
        else return q;
        
        function write (buf, enc, next) {
            this.push(buf);
            next();
        }
        function end (next) {
            if (isBuffer) this.push(',"base64")');
            this.push(null);
            next();
        }
    }
};
