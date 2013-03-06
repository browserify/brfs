var fs = require('fs');
var path = require('path');

var through = require('through');
var falafel = require('falafel');
var unparse = require('escodegen').generate;

module.exports = function (file) {
    var data = '';
    var fsNames = {};
    var vars = [ '__filename', '__dirname' ];
    var dirname = path.dirname(file);
    
    return through(write, end);
    
    function write (buf) { data += buf }
    function end () {
        var tr = this;
        var pending = 0;
        
        var output = falafel(data, function (node) {
            if (isRequire(node) && node.arguments[0].value === 'fs'
            && node.parent.type === 'VariableDeclarator'
            && node.parent.id.type === 'Identifier') {
                fsNames[node.parent.id.name] = true;
            }
            if (node.type === 'CallExpression'
            && node.callee.type === 'MemberExpression'
            && node.callee.object.type === 'Identifier'
            && fsNames[node.callee.object.name]
            && node.callee.property.type === 'Identifier'
            && node.callee.property.name === 'readFileSync') {
                
                var args = node.arguments;
                var t = 'return ' + unparse(args[0]);
                var fpath = Function(vars, t)(file, dirname);
                var enc = args[1]
                    ? Function('return ' + unparse(args[1]))()
                    : 'utf8'
                ;
                ++ pending;
                fs.readFile(fpath, enc, function (err, src) {
                    if (err) return tr.emit('error', err);
                    node.update(JSON.stringify(src));
                    if (--pending === 0) finish();
                });
            }
        });
        
        if (pending === 0) finish();
        
        function finish () {
            tr.queue(String(output));
            tr.queue(null);
        }
    }
};

function isRequire (node) {
    var c = node.callee;
    return c
        && node.type === 'CallExpression'
        && c.type === 'Identifier'
        && c.name === 'require'
    ;
}
