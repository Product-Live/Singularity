"use strict";

$.require([
    'core!database/mongo.js'
], function(
    mongo
) {

    var obj = function() {
        this._db = null;
    };
    obj.prototype = {
        _init: function() {
            var self = this, p = new $.promise();
            if ($.defined(this._db)) {
                return (p.resolve(this._db))
            }
            return ((new mongo().connect('shared')).then(function(db) {
                return ((self._db = db.collection('version')));
            }));
        },

        get: function(name) {
            return (this._init().then(function(db) {
                return (db.find({
                    name: name,
                    struct: 'version'
                }).toArray().then(function(res) {
                    if (res[0]) {
                        return (res[0].version.join('.'));
                    }
                    return ($.promise().reject(new Error('no version found')));
                }));
            }, function() {
                return ($.promise().reject(new Error('db is not responding')));
            }));
        },

        update: function(name) {
            var self = this, p = new $.promise(), db = null, info = {}, version = null;

            self._init().then(function(d) {
                return ((db = d).find({
                    name: name,
                    struct: 'version'
                }).toArray().then(function(res) {
                    return (res);
                }));
            }, function() {
                p.reject(new Error('db is not responding'));
            }).then(function(res) {
                if (res.length > 0) {
                    res[0].version[res[0].version.length -1] = Number(res[0].version[res[0].version.length -1]) + 1;
                    version = res[0].version;
                    for (var i in version) {
                        version[i] = Number(version[i]);
                    }

                    return (db.update({
                        name: name
                    }, {$set: {
                        version: version,
                        struct: 'version'
                    }}));
                } else {
                    version = (info.version || '0.0.0').split('.');
                    for (var i in version) {
                        version[i] = Number(version[i]);
                    }

                    return (db.insert({
                        name: name,
                        version: version,
                        struct: 'version'
                    }));
                }
            }).then(function() {
                p.resolve(version.join('.'));
            }, function(err) {
                p.reject(err || 'problem on update or insert of version');
            });

            return (p);
        }
    };

    module.exports = new obj();
});