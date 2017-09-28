"use strict";


$.require([
    'hyperion!/lib/docker/base/registry.js',
    'hyperion!/lib/docker/base/cert.js',
    'hyperion!/lib/docker/base/volume.js',
    'hyperion!/lib/docker/base/version.js',
    'hyperion!/build.js',
    'core!bash',
    'hyperion!/lib/docker/format.js'
], function(
    registry,
    cert,
    volume,
    version,
    build,
    bash,
    _
) {

    var obj = function () {};
    obj.prototype = $.extends('hyperion!/lib/docker/env.js', {
        _buildConfig: $.config.get('docker.build.application'), // static
        _cache: {
            shellEnv: null
        },
        registry: new registry(),
        version: new version(),
        cert: new cert(),
        volume: new volume(),

        /**
         * Init the shell env and login to registry
         *
         * @returns {*|Promise|obj}
         * @private
         */
        _initShell: function(retry) {
            var self = this, env = null, registry = $.config.get('docker.registry');

            // does not look like we need this
            if (this._cache.shellEnv) {
                return ($.promise().resolve(this._cache.shellEnv));
            }

            return (this._loadEnv((retry >= 1)).then(function(e) {
                env = e;
                console.log('load env');
                return (self.cert.load((retry >= 1)));
            }).then(function() {
                console.log('cert load');
                return (self.registry.login((retry >= 1)));
            }).then(function(login) {
                console.log('registry load');
                if (!login && !(retry >= 1)) {
                    self._cache.shellEnv = null;
                    return (self._initShell((retry || 0) + 1));
                }
                console.log('shell is loaded');
                self._cache.shellEnv = env;
                return (env);
            }));
        },

        _securePath: function(path) {
            if (!path) {
                return ('');
            }
            if (path.indexOf('!') != -1) {
                var p = $.path(path);
                if (process.platform == 'win32') {
                    var tmp = p.split(':/');
                    p = ((tmp.length == 1)? tmp.join('') : '/' + tmp.splice(0, 1) + '/' + tmp.join('')).replace('/C/', '/c/');
                }
                p = p.replace(/\/+/g, '/').replace(/\/$/, '');
                return (p);
            }

            if (process.platform == 'win32') {
                var tmp = path.split(':/');
                path = ((tmp.length == 1)? tmp.join('') : '/' + tmp.splice(0, 1) + '/' + tmp.join('')).replace('/C/', '/c/');
            }
            path = path.replace(/\/+/g, '/').replace(/\/$/, '');
            return (path);
        },

        /**
         * Get list of docker images
         *
         * @returns {*}
         */
        images: function() {
            var self = this, p = new $.promise();

            self._initShell().then(function(env) {
                return (bash.run('docker images -a', env));
            }).then(function(res) {
                var row = (res.out.join('\n')).replace(/\n/g, '  ').split(/\s{2,}/g), out = [];
                for (var i = 5; i < row.length; i += 5) {
                    if (row[i + 0] != '<none>' && i + 4 < row.length) {
                        out.push({
                            name: row[i + 0],
                            tag: row[i + 1],
                            imageID: row[i + 2],
                            created: row[i + 3],
                            size: row[i + 4]
                        });
                    }
                }
                p.resolve(out);
            }, function (err) {
                p.resolve([]);
            });

            return (p);
        },

        ps: function() {
            var self = this, p = new $.promise();

            self._initShell().then(function(env) {
                return (bash.run('docker ps -a', env));
            }).then(function(res) {
                var row = (res.out.join('\n')).replace(/\n/g, '  ').split(/\s{2,}/g), out = [];
                for (var i = 7; i < row.length; i += 7) {
                    if (i + 7 < row.length) {
                        out.push({
                            id: row[i + 0],
                            image: row[i + 1],
                            command: row[i + 2],
                            created: row[i + 3],
                            status: row[i + 4],
                            port: row[i + 5],
                            name: row[i + 7]
                        });
                    }
                }
                p.resolve(out);
            }, function (err) {
                p.resolve([]);
            });

            return (p);
        },

        /**
         * Remove container with name
         *
         * @param key
         * @returns {jQuery.promise}
         */
        remove: function(key) {
            var self = this, p = new $.promise();

            this._initShell().then(function(env) {
                return (bash.run('docker rm -f ' + _.alpha(key), env));
            }).then(function() {
                $.console.docker('container: ' + key + ' has stopped.');
                p.resolve();
            });

            return (p);
        },

        stop: function(key) {
            var self = this, p = new $.promise();

            this._initShell().then(function(env) {
                return (bash.run('docker stop ' + _.alpha(key), env));
            }).then(function() {
                $.console.docker('container: ' + key + ' has stopped.');
                p.resolve();
            });

            return (p);
        },

        /**
         * run a docker ps and format to json
         *
         * @returns {jQuery.promise}
         */
        process: function() {
            var self = this, p = new $.promise();

            self._initShell().then(function(env) {
                return (bash.run('docker ps', env));
            }).then(function(res) {
                var row = res.out.join('').split('\n'), out = [];
                for (var i = 1; i < row.length; i++) {
                    var tmp = row[i].split(/\s{2,}/g), t = {
                        id: tmp[0],
                        image: tmp[1],
                        entry: tmp[2],
                        created: tmp[3],
                        uptime: tmp[4]
                    };
                    if (tmp.length > 1) {
                        out.push($.schema.merge(t, (tmp.length == 6) ? {
                            ports: '',
                            key: tmp[5]
                        } : {
                            ports: tmp[5],
                            key: tmp[6]
                        }));
                    }
                }

                p.resolve(out);
            }, function(err) {
                p.resolve([]);
            });

            return (p);
        },

        /**
         * Build image from build file
         *
         * @param c
         * @param force
         * @returns {*}
         */
        build: function(c, force) {
            var self = this, p = new $.promise(), config = c || {}, env = null, info = null;

            if ($.is.string(c)) {
                return (this._initShell().then(function() {
                    if (!self.registry.isLocal() && force != true) { // has a registry then pull the image
                        return (self.registry.pull(c));
                    }
                    return (self.registry.login(true).then(function () {
                        if (!self.registry.isLocal() && force != true) {
                            return (self.registry.pull(c));
                        }

                        return ($.promise().reject('not connected to registry'));
                    }));
                }));
            }

            var name = (config.name || '');
            console.log('build', name);

            var b = build.get(name);
            if (b) {
                this._initShell().then(function(e) {
                    env = e;

                    console.log('use registry', (!self.registry.isLocal() && force != true));
                    if (!self.registry.isLocal() && force != true) { // has a registry pull the image
                        return (self.registry.pull(name + ':' + config.version));
                    }
                    return ($.promise().reject());
                }, function(e) {
                    console.log('build env', e);
                }).then(function(res) {
                    p.resolve(res);
                }, function() {
                    return (true);
                }).then(function() {
                    console.log('self._buildConfig', self._buildConfig);
                    console.log('building with file', info);

                    var cmd = 'docker build -f ' + b.path().replace(appRoot.absolute + '/', '') + '/DockerFile ' +
                        '-t ' + _.version(name) + ':' + _.version(config.version || info.version) + ' -t ' + _.version(name) + ':latest' + ' .';

                    return (b.setup().then(function() {
                        return (b.create());
                    }).then(function() {
                        return (cmd);
                    }));
                }).then(function(cmd) {
                    console.log('building', build, 'image');
                    console.log(cmd);
                    return (bash.raw(cmd, {/*cwd: b.path(),*/ env: env}, true));
                }).then(function(res) {
                    p.resolve(res);
                }, function(e) {
                    p.reject(e);
                });
            } else {
                self.registry.pull(name).then(function(res) {
                    p.resolve(res);
                }, function(e) {
                    p.reject(e);
                });
            }


            return (p);
        },

        /**
         * Build images that are missing if it finds a build profile
         *
         * @param l
         * @param images
         * @param b
         * @returns {*|obj}
         */
        buildImages: function(l, images, b) {
            var list = l || [], imgBuild = {}, build = b || this;
            for (var i in list) {
                imgBuild[list[i].image + ':' + list[i].version] = true;
            }
            for (var i in images) {
                if ($.defined(imgBuild[images[i].name + ':' + images[i].tag])) {
                    imgBuild[images[i].name + ':' + images[i].tag] = false;
                }
            }

            var wait = [];
            for (var i in imgBuild) {
                if (imgBuild[i] && i.match(/\/.*:/)) {
                    //console.log(i, i.match(/\/.*:/));
                    //wait.push(this.build({image: i, name: i.match(/\/.*:/)[0].slice(1, -1)}));
                    wait.push(this.build(i));
                }
            }

            return ($.all(wait).then(function() {
                return (true);
            }, function(err) {
                console.log('build image err', err);
                return (true);
            }));
        },

        /**
         * Old to be removed
         *
         * @deprecated
         * @returns {string}
         */
        getContainer: function () {
            if (!$.defined(this._config)) {
                this._config = {
                    login: this.randomKey(4),
                    appName: this.randomKey(8),
                    version: ((this.randomKey(3, '0123456789')).split('')).join('.')
                };
            }
            return ((this._config.login + '/' + this._config.appName).toLowerCase());
        }
    });

    module.exports = obj;
});