"use strict";

$.require([
    'core!database/mongo',
    'hyperion!/lib/watcher/data/model/config.js'
], function(
    mongo,
    config
) {

    var obj = function () {
        this._db = null;
    };
    obj.prototype = {
        /**
         * Init connection to the database
         *
         * @returns {*}
         * @private
         */
        _init: function() {
            var self = this, p = new $.promise();
            if ($.defined(this._db)) {
                return (p.resolve(this._db))
            }
            return ((new mongo().connect('docker')).then(function(db) {
                return ((self._db = db.collection('docker')));
            }));
        },

        is: function() {
            var p = new $.promise(), timeout = setTimeout(function() {
                p.reject();
            }, $.time.second(5).get);
            this._init().then(function(db) {
                p.resolve();
                clearTimeout(timeout);
            });
            return (p);
        },

        /**
         * Get map from database or create if not found (upsert can be used here maybe
         * )
         * @param original
         * @param key
         * @returns {*|Promise|obj}
         */
        get: function(original, key) {
            return (this._init().then(function(db) {

                return (db.find({
                    id: key,
                    struct: 'hyperion'
                }).limit(1).toArray().then(function(res) {
                    var copy = $.schema.copy(original);

                    if (res.length > 0) {
                        var model = config.create();
                        if ($.defined(copy)) {
                            model.set(copy);
                        }
                        model.set(res[0]);
                        $.file.write('resources!/hypeMap.json', $.json.encode(model.get()));
                        return (model.get());
                    } else {
                        for (var i in copy.container) {
                            copy.container[i] = {
                                key: copy.container[i].key,
                                image: copy.container[i].image,
                                version: copy.container[i].version,
                                endPoint: copy.container[i].endPoint,
                                env: copy.container[i].env,
                                volume: copy.container[i].volume,
                                port: copy.container[i].port,
                                link: copy.container[i].link
                            };
                        }
                        copy.struct = 'hyperion';
                        $.file.write('resources!/hypeMap.json', $.json.encode(copy));
                        return (db.insert(copy).then(function(res) {
                            return ($.promise().reject(new Error('skip inserted into db')));
                        }));
                    }
                }));
            }, function() {
                return ($.promise().reject(new Error('db is not responding')));
            }));
        },

        /**
         * update the map in mongo
         * 
         * @param key
         * @param data
         * @returns {Promise.<TResult>|*|obj}
         */
        set: function(key, data) {
            return (this._init().then(function(db) {
                $.file.write('resources!/hypeMap.json', $.json.encode(data));
                return (db.update({id: key, struct: 'hyperion'}, data).then(function(res) {
                    if (res) { // check update
                        return (res);
                    } else {
                        return ($.promise().reject(new Error('skip inserted into db')));
                    }
                }));
            }, function() {
                return ($.promise().reject(new Error('db is not responding')));
            }));
        },

        /**
         * Disable config map because of error found
         *
         * @param key
         * @param error
         * @returns {*|Promise|obj}
         */
        disable: function(key, error) {
            return (this._init().then(function(db) {
                return (db.update({
                    id: key,
                    struct: 'hyperion'
                }, {
                    $set: {
                        active: false
                    },
                    $push: {error: error}
                }).then(function(res) {
                    return (res);
                }));
            }, function() {
                return ($.promise().reject(new Error('db is not responding')));
            }));
        }
    };

    module.exports = obj;
});