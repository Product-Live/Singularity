"use strict";

$.require([
    'hyperion!/lib/docker/base.js',
    'hyperion!/lib/watcher/container.js',
    'hyperion!/lib/watcher/discovery.js',
    'hyperion!/lib/watcher/data.js',
    'core!think.js'
], function(
	base,
	container,
    discovery,
    data,
    think
) {
		
	var obj = function(core) {
		this._core = core;
		this._config = {
            runCycle: 0,
            runLocal: true,
            map: {
                container: []
            }
		};
		this._container = {};
        this._think = [];
        this._paused = false;
        this._version = '1.4.0';
        this._discovery = new discovery(this);
        this.data = new data(this);
	};
	obj.prototype = $.extends(base, {
		set: function(c) {
			this._config = $.schema.merge(this._config, c);
			return (this);
		},

        getMap: function() {
            return ($.schema.copy(this._config.map));
        },

        getEnv: function() {
            return (this._initShell().then(function(env) {
                return (env);
            }));
        },

        getContainer: function(name) {
            for (var i in this._container) {
                if (this._container[i].name() == name) {
                    return (this._container[i]);
                }
            }
            return (null);
        },

        /**
         * Sync the running containers with the map in memory
         *
         * @returns {*}
         */
        sync: function(cd) {
            var wait = [], data = this._config.map, start = [], remove = 0, self = this;
            cd = ($.is.function(cd)) ? cd : function() {};

            for (var i in data.container) { // create missing containers
                var key = data.container[i].key;
                if (!$.defined(this._container[key])) {
                    this._container[key] = new container(this, key);
                    start.push(key);
                }
            }

            for (var i in start) { // startup after all containers are created
                if (this._container[start[i]].map().active) {
                    wait.push(this._container[start[i]].start());
                }
            }


            for (var i in this._container) {
                if (this._container[i].isDead()) {
                    wait.push(this._container[i].destroy());
                    this._container[i] = null;
                    remove += 1;
                }
            }

            cd({info: 'updating memory map action count "' + wait.length + '"'});
            return ($.all(wait).then(function(res) {
                let wait = [], clean = {}, stopped = 0, started = 0;

                for (var i in self._container) {
                    if (self._container[i]) {
                        let map = self._container[i].map();
                        console.log('sync active', i, map.active, map.status);

                        if (map.active) {
                            if (map.status && !$.is.got(map.status, ['created', 'starting', 'running'])) {
                                cd({info: 'sync start up "' + i + '"'});
                                wait.push(self._container[i].start(false, cd));
                                started += 1;
                            }
                        } else {
                            if (map.status && !$.is.got(map.status, ['exited', 'stopped'])) {
                                cd({info: 'sync stopping "' + i + '"'});
                                wait.push(self._container[i].stop());
                                stopped += 1;
                            }
                        }
                        clean[i] = self._container[i];
                    }
                }

                console.log('sync active wait', wait.length);

                cd({info: 'running sync action count "' + wait.length + '"'});
                return ($.all(wait).then(function(r) {
                    cd({info: 'sync finished merge report'});
                    return (r);
                }, function(err) {
                    cd({info: 'sync finished merge report error' + $.json.encode(err)});
                    return ({});
                }).then(function(r) {
                    return ({
                        res: $.schema.merge().array(res, r),
                        started: start.length + started,
                        stopped: stopped,
                        removed: remove
                    });
                }));
            }));
        },

        /**
         * Clean up containers running before hype started
         *
         * @returns {boolean}
         */
        cleanUp: function(cd) {
            var self = this;
            cd = ($.is.function(cd)) ? cd : function() {};

            return (this.process().then(function(res) {
                var tmp = self._config.map, out = {}, pause = {};
                for (var i in tmp.container) {
                    for (var x in res) {
                        if (!out[res[x].key]) {
                            out[res[x].key] = (tmp.container[i].key == res[x].key);
                        }
                        if (!pause[res[x].key]) {
                            pause[res[x].key] = tmp.container[i].active;
                        }
                    }
                }

                var wait = [];
                for (var i in out) {
                    if (!out[i]) {
                        cd({info: 'remove container "' + i + '"'});
                        wait.push(self.remove(i));
                    }
                }
                for (var i in pause) {
                    if (!pause[i]) {
                        cd({info: 'stop container "' + i + '"'});
                        wait.push(self.stop(i));
                    }
                }

                return ($.all(wait));
            }).then(function() {
                return (true);
            }, function() {
                return (true);
            }));
        },

        /**
         * sync the map with the remote version then run a sync with the running containers
         *
         * @returns {*}
         */
        syncMap: function(cd) {
            var self = this, report = {};
            cd = ($.is.function(cd)) ? cd : function() {};


            cd({info: 'fetch data for key "' + this._config.key + '"'});
            return (this.data.get(this._config.key).then(function(data) {
                let tmp = data;

                cd({info: 'got data'});
                for (var i in self._config.map.container) {
                    for (var x in tmp.container) {
                        if (self._config.map.container[i].key === tmp.container[x].key) {
                            tmp.container[x] = $.schema.merge().deep(tmp.container[x], {
                                lastInspect: self._config.map.container[i].lastInspect,
                                inspect: self._config.map.container[i].inspect,
                                status: self._config.map.container[i].status,
                                ping: self._config.map.container[i].ping
                            });
                            break;
                        }
                    }
                }

                self._config.map = tmp;
                self._paused = false;

                cd({info: 'running cleanup on containers'});
                return (self.cleanUp(cd).then(function() {
                    cd({info: 'cleanup finished'});
                    return (self.sync(cd));
                }));
            }, function(err) {
                console.log('updateMap err', err);
                report.dataError = err;
                cd({info: 'error fetching data ' + err});
                return (true); // skip if failed (db connection or something)
            }).then(function(res) {
                console.log('map updated containers added', res.started, 'removed', res.removed);
                cd({info: 'map updated containers added ' + res.started + ' removed ' + res.removed});
                report.container = {
                    started: res.started,
                    stopped: res.stopped,
                    removed: res.removed
                };
                report.startResponse = res.res;
                return (true);
            }, function(err) {
                var e = [];
                for (var i in err) {
                    if (err[i]) {
                        e.push(err[i]);
                    }
                }
                report.configError = e;
                return (self.data.disable(self._config.key, e));
            }).then(function() {
                self._config.lastSyncDate = $.time.now().get;
                if (self._config.runLocal && self.registry.isLocal) {
                    return (self.registry.login(true).then(function() {
                        self._config.runLocal = false;
                        cd({info: 'send report'});
                        return (report);
                    }));
                } else {
                    self._config.runLocal = false;
                    cd({info: 'send report'});
                    return (report);
                }
            }, function() {
                cd({info: 'send error report'});
                return ($.promise().reject(report));
            }));
        },

        fullSyncMap: function(cd) {
            var self = this, report = {ping: []};
            cd = ($.is.function(cd)) ? cd : function() {};

            cd({info: 'started to update'});
            return (this.syncMap(cd).then(function(res) {
                cd({info: 'sync map from data source'});
                report = $.schema.merge(report, res);

                var wait = [], action = 0;
                for (var i in self._container) {
                    if ($.defined(self._container[i]) && self._container[i]._container().active) {
                        wait.push((function(i) {
                            cd({info: 'run ping on ' + i});
                            return (self._container[i].ping(false, cd).then(function() {
                                cd({info: 'ping on ' + i + ' is valid'});
                                report.ping.push({
                                    name: self._container[i].name(),
                                    status: 'valid'
                                });
                                return (true);
                            }, function(err) {
                                report.ping.push({
                                    name: self._container[i].name(),
                                    status: 'error',
                                    data: err
                                });

                                cd({info: 'ping on ' + i + ' had a error now recreating'});
                                return (self._container[i].recreate(cd).then(function() {
                                    cd({info: 'container ' + i + ' has been recreate "done"'});
                                    return (true);
                                }, function() {
                                    return (true);
                                }));
                            }).then(function(res) {
                                action += 1;
                                cd({info: 'sync map action ' + action + ' / ' + wait.length});
                                return (res);
                            }));
                        })(i));
                    }
                }
                
                return ($.all(wait));
            }).then(function() {
                cd({info: 'finished final action sending report from resovlve'});
                return (report);
            }, function() {
                cd({info: 'finished final action sending report from reject'});
                return (report);
            }))
        },

        /**
         * Start watcher syncing the remote map to docker
         *
         * @returns {*}
         */
		startUp: function() {
			var wait = [], self = this, p = new $.promise();

            self.images().then(function(images) {
                return (self.buildImages(self._config.map.container, images, self._core));
            }).then(function() {
                var checkContainer = [];

				self._think.push(new think(function(hook) {
                    hook.if('updataMap', function() { // update map from source (mongodb)
                        console.log('updateMap --', self._config);

                        if ($.defined(self._config.key) && self._config.autoSync) { // without the key run locally from memory
                            return (self.data.is().then(function() {
                                return (self.syncMap(function(msg) {
                                    console.log(msg);
                                }));
                            }, function() {
                                self._config.runLocal = true;
                                return (self.sync(function(msg) {
                                    console.log(msg);
                                }));
                            }).then(function() {
                                return (true);
                            }, function() {
                                return (true);
                            }));
                        } else {
                            return (self.sync(function(msg) {
                                console.log(msg);
                            }).then(function() {
                                return (true);
                            }, function() {
                                return (true);
                            }));
                        }
                    }, (self._config.runLocal)? $.time.second(5).get : self._config.rate.map);

                    hook.if('alive', function() { // are containers alive and valid
                        if (self._paused) {
                            return (true);
                        }

                        console.log('--- alive', self._config.runCycle || 0);
                        self._config.runCycle += 1;
                        for (var i in self._container) {
                            if ($.defined(self._container[i])) {
                                (function(i, container) {
                                    var map = container.map();
                                    console.log('--- ping', i, container.name());

                                    if (map.active) {
                                        container.ping(true).then(function () {
                                            if (self._container[i]) {
                                                console.log('container', container.name(), 'valid');
                                            }
                                            return (true);
                                        }, function (err) {
                                            if (self._container[i]) {
                                                console.log('container', container.name(), 'error', err);

                                                return (container.recreate());
                                            }
                                            return (true);
                                        });
                                    } else {
                                        container.isAlive().then(function() {
                                            return (true);
                                        }, function() {
                                            return (true);
                                        }).then(function() {
                                            var map = container.map();
                                            if (map.status && !$.is.got(map.status, ['exited', 'stopped'])) {
                                                console.log(map.status);
                                                return (container.stop());
                                            }
                                            return (true);
                                        });
                                    }
                                })(i, self._container[i]);
                            }
                        }
                        console.log('--- alive ---');
                        /*if (checkContainer.length == 0) {
                            for (var i in self._container) {
                                if ($.defined(self._container[i])) {
                                    checkContainer.push(self._container[i]);
                                }
                            }
                        } else {
                            var key = Math.round(Math.random() * (checkContainer.length - 1));
                            if (checkContainer[key]) {
                                var map = checkContainer[key].map();
                                console.log('--- ping', key, checkContainer.length, checkContainer[key].name());

                                if (map.active) {
                                    checkContainer[key].ping(true).then(function () {
                                        if (checkContainer[key]) {
                                            console.log('container', checkContainer[key].name(), 'valid');
                                        }
                                        return (checkContainer.splice(key, 1));
                                    }, function (err) {
                                        if (checkContainer[key]) {
                                            console.log('container', checkContainer[key].name(), 'error', err);

                                            var tmp = checkContainer.splice(key, 1)[0];
                                            return (tmp.recreate());
                                        }
                                        return (checkContainer.splice(key, 1));
                                    });
                                } else {
                                    checkContainer[key].isAlive().then(function() {
                                        return (checkContainer.splice(key, 1)[0]);
                                    }, function() {
                                        return (checkContainer.splice(key, 1)[0]);
                                    }).then(function(tmp) {
                                        var map = tmp.map();
                                        if (map.status && !$.is.got(map.status, ['exited', 'stopped'])) {
                                            console.log(map.status);
                                            return (tmp.stop());
                                        }
                                        return (true);
                                    });
                                }
                            }
                        }*/
                        /*for (var i in self._container) {
                            if ($.defined(self._container[i])) {
                                checkContainer.push(self._container[i]);
                            }
                        }*/
                    }, self._config.rate.ping);

                }, $.time.second(1)));
			});
		
			return (p);
		},

        /**
         * Pause Container and watcher
         *
         * @returns {*}
         */
        pause: function() {
            var wait = [];

            this._paused = true;
            for (var i in this._container) {
                if ($.defined(this._container[i])) {
                    wait.push(this._container[i].remove());
                }
            }
            return ($.all(wait));
        },

        /**
         * Start active containers and watcher
         * @returns {*|Promise|obj}
         */
		start: function() {
            var self = this, wait = [];

            for (var i in this._container) {
                if ($.defined(this._container[i])) {
                    wait.push(this._container[i].start());
                }
            }
            return ($.all(wait).then(function() {
                self._paused = false;
            }));
		},

        /**
         * Shutdown all containers and remove them
         *
         * @returns {*}
         */
		shutdown: function(code) {
            console.log('shutdown close code:', code);

            if (code === 2 || code === 0) {
                var wait = [];

                this._discovery.shutdown();
                for (var i in this._think) {
                    this._think[i].stop();
                }
                console.log('stopping containers...');
                for (var i in this._container) {
                    if ($.defined(this._container[i])) {
                        wait.push(this._container[i].remove());
                    }
                }
                return ($.all(wait).then(function() {
                    console.log('closed containers shutting down.');
                    return (true);
                }));
            } else {
                console.log('restart skip shutdown');
                return ($.promise().resolve());
            }
		}
	});

	module.exports = obj;
});