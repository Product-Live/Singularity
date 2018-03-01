"use strict";

$.require([
    /*'hyperion!/lib/watcher/data/model/config.js',
    'hyperion!/lib/watcher/data/model/container.js',*/
    'hyperion!/lib/watcher/data/mongo.js',
    'hyperion!/lib/watcher/data/file.js'
], function(
    /*config,
    container,*/
    mongo,
    file
) {

    var obj = function(core) {
        this._core = core;
        this._db = null;
        this._type = {
            mongo: new mongo(),
            file: new file()
        }
    };
    obj.prototype = {
        /**
         * Add none config Data
         *
         * @param data
         * @returns {*}
         * @private
         */
        _updateMap: function(data) {
            if (!data.active) {
                return ($.promise().reject(new Error(data.error)));
            }

            var merge = {
                status: '',
                startTime: 0,
                lastPing: 0,
                inspect: null,
                lastInspect: 0,
                ping: 0
            };
            for (var i in data.container) {
                data.container[i] = $.schema.merge(data.container[i], merge);
            }

            return ($.promise().resolve(data));
        },

        /**
         * Find errors in the config (maybe move this into a sub object)
         * @param data
         * @returns {{is: boolean, report: Array}}
         * @private
         */
        _isValid: function(data) {
            var port = {}, is = true, report = [];

            for (var i in data.container) {
                for (var x in data.container[i].port) {
                    port[x] = (port[x] || 0) + 1;
                }
            }
            for (var i in port) { // is the port exposed more then once
                if (port[i] > 1) {
                    is = false;
                    report.push(i + ' has been exposed ' + port[i] + ' times.');
                }
            }

            var map = {}, scanned = {}, link = function(key, linked, chain, d) {
                if (scanned[key] && d == 0) {
                    return (true);
                }
                scanned[key] = true;

                chain = chain + ((chain != '') ? '->' : '') + key;
                for (var i in map[key].link) {
                    if ($.defined(map[map[key].link[i]])) {
                        if ($.defined(linked[map[key].link[i]])) {
                            is = false;
                            report.push('circular link found on key "' + chain + '".');
                            return (false);
                        } else {
                            linked[map[key].link[i]] = true;
                            link(map[key].link[i], $.schema.copy(linked), chain, d + 1);
                        }
                    } else {
                        is = false;
                        report.push('invalid link found on key "' + key + '" for key "' + map[key].link[i] + '".');
                    }
                }
            };
            for (var i in data.container) {
                map[data.container[i].key] = data.container[i];
            }
            for (var i in map) {
                link(i, {}, '', 0);
            }

            return ({
                is: is,
                report: report
            });
        },

        /**
         * Run validation if error disable and dump error
         *
         * @returns {*|String|obj}
         * @private
         */
        _valid: function(t, key, data) {
            var p = new $.promise(), error = true;

            if (data.active) {
                return (p.resolve());
                /*var valid = this._isValid(data);
                if (valid.is) {
                    return (p.resolve());
                }

                console.log('valid', valid);
                this.disable(key, valid.report).then(function() {
                    p.reject('error found in map watcher is now in pause');
                }, function() {
                    p.reject('error found in map watcher is now in pause');
                });*/
            } else {
                p.reject('map is not active');
            }

            return (p);
        },

        disable: function(key, err) {
            var p = new $.promise(), self = this, type = $.config.get('docker.watcher.keyType');

            if ($.defined(type) && this._type[type]) {
                var t = this._type[type];

                console.log($.color.cyan(err));
                t.disable(key, {report: err, time: $.time.now().get}).then(function () {
                    return (self._core.pause());
                }, function () {
                    return (self._core.pause());
                }).then(function () {
                    p.resolve('error found in map watcher is now in pause');
                }, function () {
                    p.reject('error found in map watcher is now in pause');
                });
            } else {
                p.reject('type is not defined ' + type);
            }

            return (p);
        },

        is: function() {
            var type = $.config.get('docker.watcher.keyType');
            if ($.defined(type) && this._type[type]) {
                var t = this._type[type];
                return (t.is());
            } else {
                return ($.promise().reject(new Error('no type defined')));
            }
        },

        init: function(key) {
            var type = $.config.get('docker.watcher.keyType');
            if ($.defined(type) && this._type[type]) {
                return (this._type[type].get(this._core._config.map, key));
            } else {
                return ($.promise().reject(new Error('no type defined')));
            }
        },

        /**
         * Get the config map for a watcher to run (valid them and tell the watcher to pause)
         * 
         * @param key
         * @returns {*}
         */
        get: function(key) {
            var type = $.config.get('docker.watcher.keyType'), p = new $.promise();
            if ($.defined(type) && this._type[type]) {
                var t = this._type[type], self = this, data = null;

                t.get(this._core._config.map, key).then(function(d) {
                    return (self._valid(t, key, (data = $.schema.copy(d))));
                }, function(err) {
                    p.reject(err);
                }).then(function() {
                    console.log('--- get', data.container);
                    return (self._updateMap(data))
                }, function(err) {
                    console.log('--- get err', err);
                    p.reject(err);
                }).then(function(res) {
                    p.resolve(res);
                }, function(err) {
                    p.reject(err);
                });
            } else {
                p.reject(new Error('no type defined'));
            }
            return (p);
        },

        set: function(key, data) {
            var type = $.config.get('docker.watcher.keyType'), p = new $.promise(), self = this;
            if ($.defined(type) && this._type[type]) {
                var t = this._type[type];

                console.log('--- set', data);
                t.set(key, data).then(function() {
                    return (self._valid(t, key, data));
                }, function (err) {
                    p.reject(err);
                }).then(function () {
                    return (self._updateMap(data))
                }, function (err) {
                    console.log('--- get err', err);
                    p.reject(err);
                }).then(function (res) {
                    p.resolve(res);
                }, function (err) {
                    p.reject(err);
                });

                return (p);
            }
            return ($.promise().resolve());
        }
    };

    module.exports = obj;
});