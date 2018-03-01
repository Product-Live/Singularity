"use strict";

$.require([
    'node!child_process',
    'core!bash'
], function(
    child_process,
    bash
) {

    var obj = function () {
        this._staticCert = {
            loaded: false
        };
    };
    obj.prototype = $.extends('hyperion!/lib/docker/env.js', {
        /**
         * Add cert to dockers cert list to trust (This is used to streamline Registry https usage)
         *
         * @param path
         * @param website
         * @param count
         * @returns {*}
         * @private
         */
        _addCert: function(path, website, count) {
            var self = this, p = new $.promise();

            if (process.platform == 'win32') {
                var root = $.file.path.parse($.path(path));
                
                $.file.create(root.dir).then(function() {
                    return bash.raw('docker-machine scp ' + root.base + ' default:.', {cwd: root.dir});
                }).then(function(res) {
                    console.log(res);
                    if (res.err.length != 0) {
                        console.log(res);
                        var err = res.out.join('') + res.err.join('');
                        if (err.match('Host is not running')) {
                            self._loadEnv(true).then(function () {
                                p.resolve();
                            });
                        } else {
                            p.resolve();
                        }
                    } else {
                        var process = child_process.spawn('docker-machine', ['ssh']);
                        process.on('error', function (err) {
                            console.log(err.toString());
                        });

                        var run = true;
                        process.stdout.on('data', function (data) {
                            console.log(data.toString());
                            if (run) {
                                run = false;
                                process.stdin.write('cat /home/docker/*\n');
                                setTimeout(function () {
                                    process.stdin.write(
                                        'sudo mkdir -p /etc/docker/certs.d/' + website +
                                        '/ && sudo cp -f ~/domain.crt /etc/docker/certs.d/' + website + '/cert' + count + '.crt && exit\n'
                                    );
                                }, 50);
                            }
                        });
                        process.stderr.on('data', function (data) {
                            console.log(data.toString());
                        });

                        process.on('close', function (code) {
                            p.resolve();
                        });
                    }
                }, function(err) {
                    console.log(err);
                });
            } else if (process.platform == 'linux') {
                $.file.create('/etc/docker/certs.d/' + website + '/').then(function() {
                   return (bash.run('cp ' + $.path(path) + ' /etc/docker/certs.d/' + website + '/cert' + count + '.crt')); // weird why not use copy?
                }, function(err) {
                    p.resolve();
                    console.log(err, 'app cert for registry where not added into app login may fail.');
                }).then(function(res) {
                    p.resolve();
                });
            } else {
                console.log(process.platform, 'no supported for cert install.');
                p.resolve();
            }

            return (p);
        },

        /**
         * Load up all the certs to trust into docker
         * @returns {*}
         */
        load: function(force) {
            if (this._staticCert.loaded && !force) {
                return ($.promise().resolve());
            }
            this._staticCert.loaded = true;

            var add = $.config.get('docker.cert'), wait = [];
            for (var i in add) {
                console.log(i, add[i]);
                wait.push(this._addCert(i, add[i], wait.length));
            }
            return ($.all(wait));
        }
    });

    module.exports = obj;
});