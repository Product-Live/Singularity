"use strict";

$.require([
    'hyperion!/lib/watcher/container/valid.js',
    'node!events',
    'hyperion!/lib/docker/format.js',
    'core!bash.js'
], function(
    valid,
    events,
    _,
    bash
) {

    var obj = function(core, id) {
        this._core = core;
        //this._config = core._config;
        this._id = id;
        this._absoluteID = null;
        this._sleep = 0;
        this._valid = new valid(this);
        this._emitter = new events();
        this._starting = false;
    };
    obj.prototype = $.extends('hyperion!/lib/watcher/container/base.js', {
        /**
         * Is the container exist and is it alive?
         *
         * @returns {*}
         */
        isAlive: function() {
            var self = this, p = new $.promise();

            if (this.isDead()) {
                return ($.promise().resolve());
            }

            self._initShell().then(function (env) {
                return (bash.run('docker inspect ' + _.alpha(self._absoluteID || self._container().key), env));
            }).then(function(res) {
                var raw = res.err.join('\n') + res.out.join('\n');
                if (res.err.length > 0 && raw.match(/no\ssuch/i)) {
                    p.reject(false);
                } else {
                    var json = $.json.parse(res.out.join(' '));
                    if (!json) {
                        p.reject(true);
                        return;
                    }
                    json = ($.is.array(json))? json[0] : json;

                    // update map Data
                    self._containerUpdate({
                        lastInspect: $.time.now().get,
                        inspect: json,
                        status: ($.defined(json.State)) ? json.State.Status : 'starting',
                        ping: (self._container().ping || 0) + 1
                    });

                    if ($.is.got(self._container().status, ['created', 'running'])) {
                        p.resolve();
                    } else {
                        p.reject(true);
                    }
                }
            }, function (err) {
                p.reject(err);
            });

            return (p);
        },

        /**
         * Does container exist?
         *
         * @returns {*}
         */
        exist: function() {
            var self = this, p = new $.promise();

            self.isAlive().then(function() {
                $.console.log($.color.yellow('exist',  self._container().key));
                p.resolve();
            }, function (res) {
                $.console.log($.color.yellow('exist',  self._container().key, res));
                if (res) {
                    p.resolve();
                } else {
                    p.reject();
                }
            });

            return (p);
        },

        /**
         * Ping container test to see is alive and healthy
         *
         * @returns {*}
         */
        ping: function(pull, cd) {
            var self = this, p = new $.promise(), key = self._container().key;
            cd = ($.is.function(cd)) ? cd : function() {};

            if (this.isDead()) { // not data in marked to be removed
                return ($.promise().resolve({remove: true}));
            }

            if ((this._sleep > $.time.now().get || this._starting) && pull) { // is in grace period from startup?
                cd({info: 'skip ping in sleep phase or is pulling "' + key + '"'});
                console.log('ping', key, this._starting);
                return ($.promise().resolve());
            }

            cd({info: 'running ping "' + key + '"'});
            self.isAlive().then(function() {
                var valid = self._valid.is();

                $.console.debug('ping', valid);
                cd({info: 'ping response for "' + key + '" is ' + valid});
                if (!$.is.object(valid)) {
                    $.console.debug('ping state', self._container().status);
                    cd({info: 'ping status "' + key + '" ' + self._container().status});
                    if ($.is.got(self._container().status, ['created', 'running'])) {
                        if ($.defined(self._container().unitaryTest)) {
                            return ((new unitary({
                                config: self._container().unitaryConfig,
                                name: self._container().unitaryTest
                            })).run().then(function(res) {
                                p.resolve();
                            }, function(err) {
                                p.reject({msg: 'unitary did not pass', log: err});
                            }));
                        } else {
                            p.resolve({});
                        }
                    } else {
                        p.reject({msg: 'not running', container: self._container().status, status: 'running'});
                    }
                } else {
                    p.reject(valid);
                }

            }, function(err) {
                p.reject(err);
            });

            return (p);
        },

        /**
         * Wait on a event to happen once
         *
         * @param event
         * @returns {*}
         */
        on: function(event) {
            var self = this, p = new $.promise();

            if (event == 'start') {
                if ($.defined(this._absoluteID)) {
                    return (p.resolve(this._absoluteID));
                } else {
                    this._emitter.once(event, function() {
                        p.resolve(self._absoluteID);
                    });
                }
            } else {
                this._emitter.once(event, function() {
                    p.resolve(self._absoluteID);
                });
            }

            return (p);
        },

        /**
         * Start container (restart existing or create a new version)
         *
         * @param retry
         * @param cd
         * @returns {*|String|obj}
         */
        start: function(retry, cd) {
            var self = this, p = new $.promise(), _env = {}, key = self._container().key;
            cd = ($.is.function(cd)) ? cd : function() {};

            this._sleep = $.time.now().second(20).get;
            this._starting = true;

            cd({info: 'running start on "' + key + '"'});
            $.console.debug('running start on', self._container().key);
            self._initShell().then(function (e) {
                _env = e;
                $.console.debug('init done', self._container().key);
                return (self.images());
            }).then(function(images) {
                $.console.debug('images done', self._container().key);

                for (var i in images) {
                    if (images[i].name == self._container().image && images[i].tag == self._container().version) {
                        cd({info: 'found image skipping full "' + key + '"'});
                        return (true);
                    }
                }

                $.console.docker('pulling image', self._container().image + ':' + self._container().version);
                cd({info: 'pulling image ' + self._container().image + ':' + self._container().version + ' for "' + key + '"'});
                return (self.registry.pull(self._container().image + ':' + self._container().version, cd).then(function(res) {
                    cd({info: 'successfull image pull for container "' + key + '"'});
                    return (res);
                }, function(err) {
                    cd({info: 'error will pulling image for "' + key + '"'});
                    p.reject(err);
                }));
            }).then(function() {
                var link = self._container().link, wait = [], map = self._containerMap();

                for (var i in link) {
                    $.console.debug(link[i], ':', map[link[i]]._absoluteID);
                    wait.push(map[link[i]].on('start'));
                }

                $.console.debug('found image getting links for', self._container().key, 'are', link, wait.length);
                cd({info: 'found image getting links for ' + key + ' count ' + wait.length + ' ' + $.json.encode(link)});
                return ($.all(wait).then(function() {
                    $.console.debug('links are up for', self._container().key);
                    cd({info: 'links are up for ' + key});
                    return (self.exist());
                }));
            }).then(function() {
                var valid = self._valid.is();
                if (!$.is.object(valid) && self._container().status == 'running') {
                    cd({info: 'found a valid running container for "' + key + '"'});
                    self._core._config.startTime = $.time.now().get;
                    $.console.debug('found instance running going to use it', self._container().key, self._absoluteID);
                    self._emitter.emit('start');
                    p.resolve(self._absoluteID);
                } else {
                    $.console.docker('docker container wrong', valid);

                    cd({info: 'stopping container found and recreating "' + key + '"'});
                    return (bash.run('docker stop ' + _.alpha(self._container().key), _env).then(function() {
                        return (bash.run('docker rm -f ' + _.alpha(self._container().key), _env));
                    })); // remove and recreate with right image
                }
            }, function () {
                $.console.docker('pull image reject made us skip container check.');
                cd({info: 'no containers found for "' + key + '"'});
                return (true); // move onto create container
            }).then(function () {
                $.console.debug('creating container.');

                cd({info: 'starting container for "' + key + '"'});
                return (self._create(_env));
            }).then(function (res) {
                cd({info: 'start cotnaienr "' + key + '" output ' + $.json.encode(res)});
                self._absoluteID = res.out[0] || null;
                if (!$.defined(self._absoluteID) || res.err.length != 0) {
                    var match = [
                        'is already in use by container',
                        '\\. You have to remove \\(or rename\\) that container to be able to reuse'
                    ], data = (($.is.array(res.err))? res.err.join(' ') : res.err), found = data.match(new RegExp(match[0] + '(.*?)' + match[1]));
                    if (found) {
                        self._absoluteID = found[1].trim();
                    } else {
                        self._absoluteID = null;
                    }
                }

                self._starting = false;
                console.log('the id after all', self._absoluteID, res);
                if (!$.defined(self._absoluteID)) {
                    $.console.docker('start error', res.err, self._container().key);

                    cd({info: 'startup for cotnaienr "' + key + '" has error ' + $.json.encode(res.err)});
                    if (!retry) {
                        return (bash.run('docker stop ' + _.alpha(self._container().key), _env).then(function () {
                            return (bash.run('docker rm -f ' + _.alpha(self._container().key), _env));
                        }).then(function () {
                            self.start(true, cd);
                        }).then(function(res) {
                            p.reject(res);
                        }).then(function(res) {
                            p.reject(res);
                        }));
                    } else {
                        p.reject(res.err);
                        return (true);
                    }
                } else {
                    $.console.debug('absolute ID', self._absoluteID);
                }
                self._emitter.emit('start');
                self._core._config.startTime = $.time.now().get;
                cd({info: 'done startup for cotnaienr "' + key + '" with id "' + self._absoluteID + '"'});
                p.resolve(self._absoluteID);
            });

            return (p);
        },

        /**
         * Stop container
         *
         * @returns {*}
         */
        stop: function() {
            var self = this, p = new $.promise();

             self._initShell().then(function(env) {
                return (bash.run('docker stop ' + _.alpha(self._container().key), env));
             }).then(function(res) {
                 self._containerUpdate({status: 'stopped'});
                 $.console.docker('container: ' + self._container().key + ' has stopped.');
                 p.resolve();
             });

             return (p);
        },

        /**
         * Destroy the container and remove all links from memory
         *
         * @returns {*}
         */
        destroy: function() {
            var self = this;
            return (this.stop().then(function() {
                // TODO: add remove links from memory
                return (self.remove());
            }));
        },

        /**
         * Remove container
         * @returns {*}
         */
        remove: function() {
            var self = this, p = new $.promise(), _env = {};

            self._initShell().then(function(env) {
                _env = env;
                return (self.stop());
            }).then(function() {
                return (bash.run('docker rm -f ' + _.alpha(self._absoluteID || self._container().key), _env));
            }).then(function(res) {
                $.console.docker('container: ' + self._absoluteID + ' ' + self._container().key + ' has stopped.');
                p.resolve();
            });

            return (p);
        },

        /**
         * old version
         * 
         * @deprecated
         * @returns {*}
         */
        restart: function() {
            return (this.recreate());
        },

        /**
         * Restart container
         *
         * @returns {*}
         */
        recreate: function(cd) {
            var self = this, p = new $.promise();

            self.remove().then(function() {
                $.console.docker('container: ' + self._container().key + ' had last status:' + self._container().status + ' has been restarted.');
                return (self.start(false, cd));
            }).then(function(res) {
                $.console.docker('restart out: ', res);
                p.resolve(res);
            }, function(err) {
                $.console.docker('restart err: ', err);
                p.resolve(err);
            });

            return (p);
        },

        /**
         * Fetch logs for a running container
         *
         * @returns {promise}
         */
        logs: function(since, tail) {
            var self = this, p = new $.promise();

            self._initShell().then(function(env) {
                var cmd = 'docker logs ' + ((tail) ? '--tail=' + tail + ' ' : '') + ((since)? '--since ' + since + ' ' : '') + _.alpha(self._absoluteID || self._container().key);
                return (bash.run(cmd, env));
            }).then(function(res) {
                p.resolve(res.out.concat(res.err));
            });

            return (p);
        }
    });

    module.exports = obj;
});