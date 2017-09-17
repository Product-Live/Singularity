"use strict";

$.require([
    'node!child_process'
], function(
    child_process
) {
    
    var obj = function() {};
    obj.prototype = $.extends('!base', {
        raw: function(cmd, options, verbal) {
            var p = new $.promise(), out = [], err = [], done = false, spawn = null;
            if (verbal) {
                console.log('cmd', cmd, options);
            }

            spawn = child_process.spawn('sh', ['-c', cmd], options);
            spawn.on('error', function (err) {
                if (!done) {
                    done = true;
                    p.reject(err);
                }
            });

            spawn.stdout.on('data', function (data) {
                out.push(data.toString());
                if (verbal) {
                    console.log(out[out.length - 1]);
                }
            });

            spawn.stderr.on('data', function (data) {
                err.push(data.toString());
                if (verbal) {
                    console.log(err[err.length - 1]);
                }
            });

            spawn.on('close', function (code) {
                if (!done) {
                    done = true;
                    p.resolve({out: out, err: err, code: code, cmd: cmd});
                }
            });

            return (p);
        },
        run: function(cmd, env, verbal) {
            var p = new $.promise(), out = [], err = [], options = {cwd: $.path('root!')};

            if (env) {
                options.env = env;
            }

            return (this.raw(cmd, options, verbal));
        }
    });

    module.exports = new obj();
});