"use strict";

$.require([
    'core!git',
    'core!npm',
    'node!vm',
    'core!/module/mapper/transpile.js'
], function(
   git,
   npm,
   vm,
   transpile
) {

    var obj = function() {
        this._path = {};
    };
    obj.prototype = $.extends('!base', {
        _getConfig: function(res) {
            try {
                var d = res.replace(/[\r\n\t\s]/g, ''), out = {};
                var pattern = /module\.exports=function\(\){return\(?(.+?)\)?;};/m;
                var match = pattern.exec(d), sandbox = {config: {}};
                if (match) {
                    vm.createContext(sandbox);
                    vm.runInContext('var config = ' + match[1], sandbox);
                }

                return (sandbox.config || {});
            } catch(e) {
                throw e;
            }
            return ({});
        },

        /**
         * Fetch npm dependencies loaded modules have
         *
         * @param res
         * @returns {{}}
         * @private
         */
        _dependencies: function(res) {
            const config = this._getConfig(res);
            if (config && config.dependencies) {
                return (config.dependencies);
            }
            return ({});
        },

        /**
         * Get path to moduels
         *
         * @param module
         * @returns {*}
         */
        get: function(module) {
            if ($.defined(this._path[module])) {
                return (this._path[module]);
            }
            throw new Error('did not load modules paths or tried to load a module that does not exist "' + module + '"');
        },


        transpile: function(module) {
            const cache = $.config.get('module.path.remote') + '/', path = this._path[module];

            return $.file.read(path + '/config.js').then((res) => {
                const config = this._getConfig(res);
                if (config.type && config.type.toLowerCase() == 'typescript') {
                    let key = cache + $.crypto.hash(module) + 'ts', p = $.promise();

                    $.file.remove(cache + key).then(() => {
                        return  $.file.copy(path, key);
                    }).then(() => {
                        return $.file.list(key, true);
                    }, (err) => {
                        p.resolve();
                    }).then((res) => {
                        let out = [], configDep = {};
                        for (let i in config.route) {
                            if ($.is.string(config.route[i])) {
                                configDep[config.route[i]] = true;
                                configDep['/' + config.route[i]] = true;
                            }
                        }
                        for (let i in config.import) {
                            if ($.is.string(config.import[i])) {
                                configDep[config.import[i]] = true;
                                configDep['/' + config.import[i]] = true;
                            }
                        }

                        for (let i in res) {
                            let skip = false;
                            for (let x in config.ignore) {
                                if (res[i].match(config.ignore[x])) {
                                    skip = true;
                                    break;
                                }
                            }
                            res[i] = res[i].replace(key, '');
                            if (!skip && !configDep[res[i]] && res[i] != '/config.js') {
                                out.push((new transpile(res[i].replace(key, ''))).run());
                            }
                        }

                        $.all(out).then(() => {
                            p.resolve();
                        });
                    }, (err) => {
                        console.log(err);
                        p.resolve();
                    });

                    return p;
                }
                return true;
            }, () => {
                return true;
            });
        },

        /**
         * Load remote modules and create a map of paths to modules
         *
         * @returns {*}
         */
        load: function(modules) {
            var remote = $.config.get('module.repository.modules'), path = $.config.get('module.path'), self = this;

            var n = new npm();
            return ($.file.create(path.remote).then(function() {
                var wait = [];
                for (var i in remote) {
                    self._path[remote[i].name] = path.remote + '/' + remote[i].name;
                    (function(remote) {
                        var g = new git(remote.repo, {path: path.remote, name: remote.name}), p = $.promise();
                        g.status().then(function(res) {
                            if (remote.commit == res) {
                                p.resolve();
                                return;
                            }
                            return (g.clone());
                        }).then(function() {
                            return (g.fetch());
                        }).then(function() {
                            return (g.reset(remote.commit));
                        }).then(function() {
                            p.resolve();
                        });

                        wait.push(p);
                    })(remote[i]);
                }

                return ($.all(wait));
            }).then(function() {
                return ($.file.list(path.module));
            }).then(function(res) {
                for (var i in res) {
                    self._path[res[i]] = path.module + '/' + res[i];
                }
                return true;
            }).then(function() {
                const wait = [];
                for (let i in modules) {
                    wait.push(self.transpile(modules[i]));
                }
                return $.all(wait);
            }).then(() => {
                var wait = [];
                for (var i in self._path) {
                    (function(path) {
                        wait.push($.file.read(path + '/config.js').then(function(res) {
                            n.add(self._dependencies(res));
                            return (true);
                        }, function() {
                            return (true);
                        }))
                    })(self._path[i]);
                }

                return ($.all(wait));
            }).then(function() {
                return (n.update());
            }));
        }
    });

    module.exports = new obj();
});
