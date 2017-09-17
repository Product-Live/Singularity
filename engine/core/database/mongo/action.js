"use strict";

$.require([
    'npm!mongodb',
    'core!/database/mongo/basic.js',
    'core!/database/mongo/action/bulk.js',
    'core!/database/mongo/action/find.js'
], function(
    mongodb,
    basic,
    bulk,
    find
) {

    var obj = function(connection, url) {
        this._connection = connection;
        this._url = url;
        this._collection = this._collectionList().default;
	};
	obj.prototype = {
        /**
         * get base config it's a function because of config reloads
         *
         * @returns {*}
         * @private
         */
        _collectionList: function() {
            return ($.config.get('mongo.collection'));
        },

        /**
         * find out if we are connected to the database
         * 
         * @returns {bool}
         */
        isAlive: function() {
            return ($.is.object(this._connection) && $.defined(this._connection._handle[this._url]));
        },

        /**
         * Set the collection for a db connection
         * @param key
         * @returns {obj}
         */
        collection: function(key) {
            var c = this._collectionList();
            this._collection = ($.defined(c[key])) ? c[key] : key;
            return (this);
        },

        /**
         * is the handle open?
         *
         * @returns {*|Promise|Window}
         */
        open: function() {
            return (this._connection.open(this._url));
        },

        /**
         * get handle for database using the correct collection
         *
         * @returns {*|obj|Collection|{default, log, docker, task, hyperion}}
         * @constructor
         */
        DB: function() {
            var c = this._connection.get(this._url);
            return ((c) ? c.collection(this._collection) : null);
        },

        /**
         * Insert data into database (merges the many and single)
         *
         * @param array
         * @returns {*}
         */
        insert: function(array) {
            var p = new $.promise(), self = this;

            this.open().then(function() {
                var opt = 'insertOne';
                if (Array.isArray(array)) {
                    if (array.length >= 2) {
                        opt = 'insertMany';
                    } else {
                        array = array[0];
                    }
                }

                if ($.defined(array)) {
                    self.DB()[opt](array, function (err, res) {
                        if (err) {
                            p.reject(err);
                        } else {
                            p.resolve({
                                result: res.result,
                                inserted: res.ops,
                                count: res.insertedCount,
                                id: res.insertedId
                            });
                        }
                    });
                } else {
                    p.resolve({result: null, inserted: [], count: 0, id: null});
                }
            });

            return (p);
        },

        /**
         * update a single row
         *
         * @param find
         * @param set
         * @param options
         * @returns {*}
         */
        update: function(find, set, options) {
            var p = new $.promise(), self = this;

            this.open().then(function() {
                self.DB().updateOne(find, set, options, function(err, result) {
                    if (err) {
                        p.reject(err);
                    } else {
                        p.resolve(result.result);
                    }
                });
            });

            return (p);
        },

        /**
         * Update more then one row
         *
         * @param find
         * @param set
         * @returns {*}
         */
        updateMany: function(find, set) {
            var p = new $.promise(), self = this;

            this.open().then(function() {
                self.DB().updateMany(find, set, function(err, result) {
                    if (err) {
                        p.reject(err);
                    } else {
                        p.resolve(result.result);
                    }
                });
            });

            return (p);
        },

        /**
         * Remove one row
         *
         * @param find
         * @returns {*}
         */
        remove: function(find) {
            var p = new $.promise(), self = this;

            this.open().then(function() {
                self.DB().deleteOne(find, function(err, result) {
                    if (err) {
                        p.reject(err);
                    } else {
                        p.resolve(result.result);
                    }
                });
            });

            return (p);
        },

        /**
         * Remove more then one row
         *
         * @param find
         * @returns {*}
         */
        removeMany: function(find) {
            var p = new $.promise(), self = this;

            this.open().then(function() {
                self.DB().deleteMany(find, function(err, result) {
                    if (err) {
                        p.reject(err);
                    } else {
                        p.resolve(result.result);
                    }
                });
            });

            return (p);
        },

        /**
         * Get Count for a find
         *
         * @param find
         * @returns {*}
         */
        count: function(find) {
            var p = new $.promise(), self = this;

            this.open().then(function() {
                self.DB().count(find, function(error, count) {
                    if (error) {
                        p.reject(error);
                    } else {
                        p.resolve(count)
                    }
                });
            });

            return (p);
        },

        /**
         * Modify before getting row good for locks
         *      http://mongodb.github.io/node-mongodb-native/2.0/api/Collection.html#findAndModify
         *
         * @param find
         * @param sort
         * @param set
         * @param options
         * @returns {*}
         */
        findAndModify: function(find, sort, set, options) {
            var p = new $.promise(), self = this;

            this.open().then(function() {
                self.DB().findAndModify(find, sort, set, options, function(err, doc) {
                    if (!err) {
                        p.resolve(doc);
                    } else {
                        p.reject(err);
                    }
                });
            });

            return (p);
        },

        /**
         * Mongo version of Group by
         *
         * @param param
         * @returns {*}
         */
        aggregate: function(param) {
            var p = new $.promise(), self = this;

            this.open().then(function() {
                self.DB().aggregate(param, function(err, result) {
                    if (err) {
                        p.reject(err);
                    } else {
                        p.resolve(result);
                    }
                });
            });

            return (p);
        },

        /**
         * Cast a value into objectID if possible
         * @param id
         * @returns {*|ObjectID|Object}
         * @constructor
         */
        ObjectID: function(id) {
            return (basic.ObjectID(id));
        },

        /**
         * Create a find operation object
         * @param q
         * @param field
         * @returns {*}
         */
        find: function(q, field) {
            return (new find(this, q, field));
        },

        /**
         * Create a bulk operation object
         *
         * @param param
         * @returns {*}
         */
        bulk: function(param, order) {
            param = param || {wtimeout: 300000};
            return (new bulk(this, param, order));
        }
	};

    module.exports = obj;
});