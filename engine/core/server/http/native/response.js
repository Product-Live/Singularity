"use strict";

$.require([
    'node!url'
], function(
    url
) {

    var obj = function(req, res, custom) {
        this._req = req;
        this._res = res;
        this._custom = custom; // used to override data
    };

    obj.prototype = $.extends('!base', {
        /**
         * url resolved
         *
         * @returns {obj.url|Function|string|*|string}
         */
        url: function() {
            return ($.defined(this._custom.url) ? this._custom.url : this._req.url).split('?')[0];
        },

        /**
         * Origin of the request
         *
         * @returns {*}
         */
        origin: function() {
            return ($.defined(this._custom.origin) ? this._custom.origin : this._req.headers.host);
        },

        /**
         * Request for the method
         *
         * @returns {obj.method|Function|*|Array|string|string}
         */
        method: function() {
            return ($.defined(this._custom.method) ? this._custom.method : this._req.method);
        },

        /**
         * Get the data for request
         *
         * @returns {*}
         */
        data: function() {
            var data = {}, query = url.parse(this._req.url, true).query;

            for (var i in query) {
                data[i] = query[i];
            }

            for (var i in this._req.body) {
                data[i] = this._req.body[i];
            }

            return (data);
        },

        /**
         * Brute request object
         *
         * @returns {*}
         */
        req: function() {
            return (this._req);
        },

        /**
         * Brute response object
         *
         * @returns {*}
         */
        res: function() {
            return (this._res);
        }
    });

    module.exports = obj;
});