var test = require('tap').test;
var browserify = require('browserify');
var through = require('through');

var vm = require('vm');
var fs = require('fs');
var path = require('path');

var expectedOutput = fs.readFileSync(__dirname + '/files/transformer.md', 'utf8');
    expectedOutput = expectedOutput.replace('#', '##');

test('perform transform(s) on parsed files', function (t) {
    t.plan(1);

    function write (data) {
        data = data.replace('#', '##');

        this.queue(data);
    }

    function end () {
        this.queue(null);
    }

    var b = browserify();
        b.add(__dirname + '/files/transformer.js');
        b.transform(path.dirname(__dirname), {
            transformer: function(filename) {
                if (/\.md$/.test(filename)) {
                    return through(write, end);
                }

                return through();
            }
        });

    b.bundle(function (err, src) {
        if (err) t.fail(err);

        vm.runInNewContext(src, { console: { log: log } });
    });

    function log (actualOutput) {
        t.equal(expectedOutput, actualOutput);
    }
});
