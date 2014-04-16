var test = require('tap').test;
var exec = require('child_process').exec;

test('cmd.js', function (t) {
  t.plan(1);
  exec(__dirname + '/../bin/cmd.js ' + __dirname + '/files/main.js',
    function (error) {
      if (error !== null) {
        t.fail();
      } else {
        t.pass();
      };
    }
  );
});