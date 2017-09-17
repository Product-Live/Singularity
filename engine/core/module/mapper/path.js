"use strict";

$.require([
    'core!git',
    'core!npm'
], function(
   git,
   npm
) {

    var obj = function() {
        this._path = {};
    };
    obj.prototype = $.extends('!base', {
        /**
         * Fetch npm dependencies loaded modules have
         * Don't like this but looks like the safer way of doing it
         *
         * @param res
         * @returns {{}}
         * @private
         */
        _dependencies: function(res) {
            try {
                var d = res.replace(/[\r\n\t\s']/g, ''), out = {};
                d = d.match(/dependencies:\s*{.*?}/);
                if (d && d[0]) {
                    d = d[0].substr(14, d[0].length - 15).split(',');
                    for (var i in d) {
                        var x = d[i].split(':');
                        out[x[0]] = x[1];
                    }
                }
            } catch(e) {
                console.log('failed to get dependencies from mo');
            }
            return (out);
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

        /**
         * Load remote modules and create a map of paths to modules
         *
         * @returns {*}
         */
        load: function() {
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