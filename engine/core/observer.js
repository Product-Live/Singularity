"use strict";

$.require([
    'node!fs',
    'node!events'
], function(
    fs,
    events
) {

    /**
     * Watch directory and emit event on changes
     */
    var obj = function(path) {
        this._path = ($.is.array(path)) ? path : [path];
        this._watch = {};
        this._event = new events();
        this._list = {};
        this._map = null;
        this._lock = false;
        var self = this;

        setInterval(function() {
            if (!self._lock) {
                for (var i in self._list) {
                    if (self._list[i]) {
                        self._event.emit(self._list[i].event, {
                            path: self._list[i].path,
                            directory: self._list[i].directory
                        });
                        self._list[i] = null;
                    }
                }
            }
        }, 1000);
    };
    obj.prototype = {
        lock: function() {
            this._lock = true;
        },
        unlock: function() {
            this._lock = false;
        },

        hook: function(path, root) {
            var self = this;

            if (self._watch[path] || path.indexOf('__jb_tmp__') != -1) {
                return (true);
            }

            self._watch[path] = fs.watch(path, {encoding: 'buffer'}, function(event, filename) {
                if (filename) {
                    $.file.stat(path).then(function(r) {
                        if (r.stats.isDirectory()) {
                            self.load();
                        } else {
                            self._list[path] = {
                                event: 'change',
                                path: path,
                                directory: r.stats.isDirectory()
                            };
                        }
                    });
                }
            });
            self._watch[path].on('error', function () {
                self._watch[path].close();
                self._watch[path] = null;
            });
        },

        remove: function(path) {
            if (self._watch[path]) {
                self._watch[path].close();
                self._watch[path] = null;
                return (true);
            }
            return (false);
        },

        map: function(path, map, root) {
            var self = this;

            return ($.file.stat(path).then(function(r) {
                if (r.stats.isDirectory()) {
                    if (root) {
                        self.hook(path, root);
                    }

                    return ($.file.list(path).then(function(r) {
                        var wait = [];
                        for (var i in r.files) {
                            var key = path + '/' + r.files[i];
                            if (key.indexOf('__jb_tmp__') == -1) {
                                map[key] = false;
                                wait.push(self.map(key, map, true));
                            }
                        }
                        return ($.all(wait));
                    }));
                } else {
                    if (path.indexOf('__jb_tmp__') == -1) {
                        map[path] = true;
                        self.hook(path, root);
                    }
                }
                return (map);
            }).then(function(r) {
                return (map);
            }, function() {
                return (map);
            }));
        },

        load: function() {
            var self = this, wait = [];
            for (var i in this._path) {
                wait.push(this.map($.path(this._path[i]), {}, true));
            }
            return ($.all(wait).then(function(map) {
                var tmp = {};
                for (var i in map) {
                    tmp = $.schema.merge(tmp, map[i]);
                }
                map = tmp;

                if (self._map) {
                    for (var i in self._map) {
                        if (!$.defined(map[i])) {
                            self._list[i] = {
                                event: 'remove',
                                path: i,
                                directory: false
                            };
                        }
                    }

                    for (var i in map) {
                        if (!$.defined(self._map[i])) {
                            self._list[i] = {
                                event: 'add',
                                path: i,
                                directory: false
                            };
                        }
                    }
                }
                self._map = map;

                return (true);
            }));
        },

        close: function() {
            for (var i in this._watch) {
                this._watch[i].close();
            }
        },

        once: function(event, call) {
            this._event.once(event, call);
            return (this);
        },

        on: function(event, call) {
            this._event.on(event, call);
            return (this);
        }
    };

    module.exports = obj;
});