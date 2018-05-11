"use strict";

$.require([
    'node!events',
    'core!bash',
    'hyperion!/lib/docker/format.js'
], function(
    events,
    bash,
    _
) {

    var obj = function() {
        this._staticRegistry = {
            login: false,
            local: false
        };
        this._pull = {};
    };
    obj.prototype = $.extends('hyperion!/lib/docker/env.js', {
        /**
         * are we skipping the us of registry?
         *
         * @returns {boolean}
         */
        isLocal: function() {
            return (this._staticRegistry.local);
        },

        getBacklog: function() {
            var out = {};
            for (var i in this._pull) {
                out[i] = {
                    image: this._pull[i].image,
                    log: this._pull[i].log,
                    date: this._pull[i].date,
                    status: this._pull[i].status
                }
            }
            return (out);
        },

        /**
         * Login into private registry to pull or push images
         *
         * @param force
         * @returns {*}
         */
        login: function(force) {
            var self = this, registry = $.schema.copy($.config.get('docker.registry')) || {};
            registry = ($.is.array(registry)) ? registry : [registry];

            if (this._staticRegistry.login) {
                return ($.promise().resolve(true));
            }

            if ($.config.get('docker.env.isLocal'))  {
                this._staticRegistry.login = true;
                this._staticRegistry.local = true;
                console.log('no registry given will work with a local version.');
                return ($.promise().resolve(true));
            }

            return (this._loadEnv().then(function(env) {
                let wait = [];
                for (let i in registry) {
                    wait.push(bash.run('docker login -u ' + registry[i].user + ' -p ' + registry[i].password + ' ' + registry[i].address, env, true).then((res) => {
                        if (res.out.length == 0 || res.out.join('\n').indexOf('Login Succeeded') == -1) {
                            return (false);
                        }
                        return (true);
                    }));
                }
                return $.all(wait);
            }).then(function(res) {
                let loggedin = true;
                for (let i in res) {
                    if (!res[i]) {
                        loggedin = false;
                    }
                }
                if (!loggedin) {
                    self._staticRegistry.local = true;
                    self._staticRegistry.login = false;
                    registry.password = '****';
                    return (false);
                }
                self._staticRegistry.local = false;
                self._staticRegistry.login = true;
                return (true);
            }));
        },

        /**
         * Logout of a registry (remove the auth from docker)
         * @returns {*|obj|Promise}
         */
        logout: function() {
            var self = this, registry = $.config.get('docker.registry');
            registry = ($.is.array(registry)) ? registry : [registry];

            return (this._loadEnv().then(function(env) {
                let wait = [];
                for (let i in registry) {
                    wait.push(bash.run('docker logout ' + registry.address, env, true));
                }
                return $.all(wait);
            }).then(function() {
                self._staticRegistry.login = false;
                return (true);
            }));
        },

        /**
         * Push image from system to remote registry
         *
         * @param image
         * @returns {*|obj}
         */
        push: function(image) {
            var self = this, registry = $.config.get('docker.registry'), env = null;
            registry = ($.is.array(registry)) ? registry : [registry];

            return (this._loadEnv().then(function(e) {
                let wait = [];
                for (let i in registry) {
                    wait.push(bash.run('docker tag ' + image + ' ' +  registry[i].address + '/' + image, (env = e), true));
                }
                return $.all(wait);
            }).then(function() {
                let wait = [];
                for (let i in registry) {
                    wait.push(bash.run('docker push ' +  registry[i].address + '/' + _.version(image), env, true));
                }
                return $.all(wait);
            }).then(function(res) {
                for (let i in res) {
                    if (res[i].err.length != 0) {
                        console.log('Failed to pull image building from local.');
                        return ($.promise().reject());
                    }
                }
                return (true);
            }));
        },

        /**
         * Pull image from remote (they then after need to be re-tagged for a clean local use)
         *
         * @param image
         * @param cd
         * @returns {*|obj|Promise}
         */
        pull: function(image, cd) { // TODO: bug here does not pull
            var self = this, registry = $.config.get('docker.registry'), env, out = {};
            registry = ($.is.array(registry)) ? registry[0] : registry;

            var path = registry.address + '/' + _.version(image), key = $.key.random();
            cd = ($.is.function(cd)) ? cd : function() {};

            if (self._pull[path] && self._pull[path].status == 'running') {
                var p = new $.promise();
                cd({info: 'waiting for image to be pulled "' + image + '"'});
                self._pull[path].emitter.once('pull', function(res) {
                    cd({info: 'finished pulling image "' + image + '"'});
                    p.resolve(res);
                });
                return (p);
            }

            console.log('trying to pull', image);
            return (this._loadEnv().then(function(e) {
                cd({info: 'pulling image "' + path + '" pull progress key "' + key + '"'});
                self._pull[path] = {
                    image: path,
                    log: [],
                    emitter: new events(),
                    date: {start: $.time.now().get, update: null, end: null},
                    status: 'running'
                };

                return (bash.run('docker pull ' + path, (env = e), function(msg) {
                    console.log(msg);
                    self._pull[path].log.push(msg);
                    self._pull[path].date.update = $.time.now().get;
                    cd({info: msg});
                }));
            }).then(function(res) {
                if (res.err.length != 0) {
                    console.log('Failed to pull image building from local.');
                    return ($.promise().reject(res.error));
                }

                out = $.schema.merge().array(out, res);
                return (bash.run('docker tag ' + path + ' ' + _.version(image), env, function(msg) {
                    cd({info: msg});
                }));
            }).then(function(res) {
                out = $.schema.merge().array(out, res);
                self._pull[path].status = 'finished';
                self._pull[path].date.end = $.time.now().get;
                self._pull[path].emitter.emit('pull', out);

                cd({info: 'finished pulling image "' + image + '"'});
                return (out);
            }, function(err) {
                return ($.promise().reject(err));
            }));
        }
    });

    module.exports = obj;
});
