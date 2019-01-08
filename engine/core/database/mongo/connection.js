"use strict";

$.require([
    'core!/database/mongo/action.js',
    'npm!mongodb',
    'node!events'
], function(
    action,
    mongodb,
    events
) {

    var obj = function(debug) {
        this._debug = debug;
    };
    obj.prototype = {
        _handle: {},
        _event: new events.EventEmitter,
        _options: function() {
            return ($.config.get('mongo.config'));
        },

        /**
         * is the handle open?
         *
         * @param url
         * @returns {*}
         */
        open: function(url) {
            var p = new $.promise();

            if (this._handle[url]) {
                return (p.resolve());
            } else {
                this._event.once('open', function(type) {
                    if (url == type) {
                        p.resolve();
                    }
                });
                return (p);
            }
        },

        /**
         * Try and connect to the database
         *
         * @param url
         * @param retry
         * @returns {*}
         */
        connect: function(url, retry) {
            var self = this, p = new $.promise();

            if (this._handle[url]) {
                p.resolve(new action(self, url));
            } else {
                try {
                    mongodb.MongoClient.connect(url, this._options(), function(err, db) {
                        if (err) {
                            self._handle[url] = null;
                            //console.log('failed to connect to mongo', err);
                            if (retry !== false) {
                                setTimeout(function () {
                                    self.connect(url).then(function(res) {
                                        p.resolve(res);
                                    }, function (err) {
                                        p.reject(err);
                                    });
                                }, 1000);
                            } else {
                                p.reject(err);
                            }
                        } else {
                            db.on('close', function() {
                                self._handle[url] = null;
                                if (retry !== false) {
                                    self.connect(url, retry);
                                }
                            });
                            self._handle[url] = db;
                            self._event.emit('open', url);
                            p.resolve(new action(self, url));
                        }
                    });
                } catch(err) {
                    console.log(mongodb.toString());
                    p.reject(err);
                }
            }

            return (p);
        },

        /**
         * Get handle from cache
         * @param url
         * @returns {*}
         */
        get: function(url) {
            return (this._handle[url]);
        },

        /**
         * Close and cached handle
         *
         * @param url
         * @returns {*|Promise|void}
         */
        close: function(url) {
            var tmp = this._handle[url];
            this._handle[url] = null;
            return (tmp.close());
        },

        /**
         * Close all handle in Memory
         *
         * @returns {*|String|obj}
         */
        shutdown: function() {
            for (var i in this._handle) {
                if (this._handle[i]) {
                    this._handle[i].close();
                    this._handle[i] = null;
                }
            }
            return ($.promise().resolve());
        }
    };

    module.exports = obj;
});