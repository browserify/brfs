var fs = require('fs');
var path = require('path');

var through = require('through');
var falafel = require('falafel');
var unparse = require('escodegen').generate;

module.exports = function (file) {
    if (/\.json$/.test(file)) return through();
    var data = '';
    var fsNames = {};
    var vars = [ '__filename', '__dirname' ];
    var dirname = path.dirname(file);
    var pending = 0;
    
    var tr = through(write, end);
    return tr;
    
    function write (buf) { data += buf }
    function end () {
        try { var output = parse() }
        catch (err) {
            this.emit('error', new Error(
                err.toString().replace('Error: ', '') + ' (' + file + ')')
            );
        }
        
        if (pending === 0) finish(output);
    }
    
    function finish (output) {
        tr.queue(String(output));
        tr.queue(null);
    }
    
    function parse () {
        var output = falafel(data, function (node) {
            if (isRequire(node) && node.arguments[0].value === 'fs'
            && node.parent.type === 'VariableDeclarator'
            && node.parent.id.type === 'Identifier') {
                fsNames[node.parent.id.name] = true;
            }
            if (isRequire(node) && node.arguments[0].value === 'fs'
            && node.parent.type === 'AssignmentExpression'
            && node.parent.left.type === 'Identifier') {
                fsNames[node.parent.left.name] = true;
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
                    if (--pending === 0) finish(output);
                });
            }
        });
        return output;
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
