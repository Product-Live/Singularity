"use strict";

$.require([
    'core!/database/mongo/connection.js',
    'core!/database/mongo/basic.js'
], function(
    connection,
    basic
) {

    var obj = function(debug) {
        if (this instanceof obj) {
            this._connection = new connection(debug);
            this._config = $.config.get('mongo.connection');
        } else {
            return (basic);
        }
    };
	obj.prototype = {
        /**
         * Connect to database or use a cached handle
         *
         * @param key
         * @param retry
         * @returns {*|Promise}
         */
        connect: function(key, retry) {
            if ($.defined(this._config[key]) || $.is.string(key)) {
                return (this._connection.connect(this._config[key] || key, retry));
            } else {
                throw Error(key + ' is not a valid connection for mongodb');
            }
        },

        /**
         * Shutdown all connection to mongodb in memory
         *
         * @returns {*|Promise|obj|String}
         */
        shutdown: function() {
            return (this._connection.shutdown());
        }
	};

    module.exports = obj;
});