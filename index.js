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

    function containsUndefinedVariable (node) {
        if (node.type === 'Identifier') {
            if (vars.indexOf(node.name) === -1) {
                return true;
            }
        }
        else if (node.type === 'BinaryExpression') {
            return containsUndefinedVariable(node.left)
                || containsUndefinedVariable(node.right)
            ;
        }
        else {
            return false;
        }
    };
    
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
            
            if (node.type !== 'CallExpression' || !isFs(node.callee)) return;
            
            var type;
            if (isRFS(node.callee.property)) type = 'sync';
            else if (isRF(node.callee.property)) type = 'async';
            if (!type) return;
            
            var args = node.arguments;
            var canBeInlined = !containsUndefinedVariable(args[0]);
            if (!canBeInlined) return;
            
            var t = 'return ' + unparse(args[0]);
            var fpath = Function(vars, t)(file, dirname);
            
            var enc = null;
            if (args[1] && !/^Function/.test(args[1].type)) {
                enc = Function('return ' + unparse(args[1]))()
            }
            
            ++ pending;
            if (enc && typeof enc === 'object' && enc.encoding) {
                enc = enc.encoding;
            }
            
            var isBuffer = false;
            if (enc === null || enc === undefined) {
                isBuffer = true;
                enc = 'base64';
            }
            fs.readFile(fpath, enc, function (err, src) {
                if (err) return tr.emit('error', errorWithFile(file, err));
                var code = isBuffer
                    ? 'Buffer(' + JSON.stringify(src) + ',"base64")'
                    : JSON.stringify(src)
                ;
                if (type === 'sync') {
                    node.update(code);
                }
                else if (type === 'async') {
                    var cb = args[2] || args[1];
                    if (!cb) return;
                    node.update(
                        'process.nextTick(function () {'
                        + '(' + cb.source() + ')'
                        + '(null,' + code + ')'
                        + '})'
                    );
                }
                tr.emit('file', fpath);
                if (--pending === 0) finish(output);
            });
        });
        return output;
    }
    
    function isFs (p) {
        if (!p) return false;
        if (p.type !== 'MemberExpression') return false;
        return (p.object.type === 'Identifier' && fsNames[p.object.name])
            || isRequire(p.object)
        ;
    }
};

function isRFS (node) {
    return node.type === 'Identifier' && node.name === 'readFileSync';
}

function isRF (node) {
    return node.type === 'Identifier' && node.name === 'readFile';
}

function isRequire (node) {
    var c = node.callee;
    return c
        && node.type === 'CallExpression'
        && c.type === 'Identifier'
        && c.name === 'require'
    ;
}

function errorWithFile (file, err) {
    var e = new Error(err.message + '\n  while running brfs on ' + file);
    e.file = file;
    return e;
}
