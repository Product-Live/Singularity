"use strict";

$.require([
    'node!child_process',
    'node!fs',
    'core!bash'
], function(
    child_process,
    fs,
    bash
) {

    var obj = function(key) {
        this._key = key;
    };
    obj.prototype = $.extends('!base', {
        tmp: function(list, code) {
            var path = $.path('cache!tmp/' + code + '.js');

            var run = function(i) {
                if (!list[i]) {
                    console.log('finished');
                    return ($.promise().resolve());
                }
                console.log('start', list[i]);
                var writableStream = fs.createWriteStream(path, {
                    flags: 'a',
                    encoding: null,
                    mode: 0o666
                });
                var p = new $.promise(), readableStream = fs.createReadStream($.path(list[i]));
                readableStream.pipe(writableStream);
                writableStream.write('\n');

                readableStream.on('end', function() {
                    console.log('done', list[i]);
                    run(i + 1).then(function() {
                        p.resolve();
                    })
                }).on('error', function(err) {
                    console.log('err', list[i], err);
                });

                return (p);
            };
            return (run(0));
        },

        raw: function(files, output) {
            var p = new $.promise(), code = $.key.plain();

            if (!$.is.array(files) || !$.is.string(output)) {
                throw new Error('input is wrong.');
            }

            bash.run('java --version').then(function() {
                var err = res.err.join('');
                if (res.err.length != 0 || err.match(/error/)) {
                    p.reject(err);
                } else {
                    return (true);
                }
            }, function(err) {
                p.reject(err);
            }).then(function() {
                return self.tmp(files, code);
            }).then(function() {
                var cmd = 'java -jar ' + $.path($.config.get('closure.core.path')) +
                    //' --warning_level VERBOSE' +
                    //' --compilation_level=ADVANCED_OPTIMIZATIONS' +
                    ' --js ' + $.path('cache!tmp/' + code + '.js') +
                    ' --js_output_file ' + $.path(output);

                return (bash.run(cmd, null, false));
            }).then(function(res) {
                var err = res.err.join('');
                if (res.err.length != 0 && !err.match(/0\serror\(s\),/)) {
                    p.reject(err);
                } else {
                    return ($.file.remove('cache!tmp/' + code + '.js'));
                }
            }).then(function() {
                return ($.file.stat($.path(output)));
            }).then(function() {
                p.resolve()
            }, function(err) {
                p.reject(err);
            });

            return (p);
        },
        
        build: function() {
            var config = $.config.get('closure.build.' + this._key);

            if (!config) {
                throw new Error('no build profile to run.');
            }

            return (this.raw(config.files, config.output));
        }
    });

    module.exports = obj;
});