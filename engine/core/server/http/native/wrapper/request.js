"use strict";

$.require([
    'node!url'
], function(
    url
) {

    var obj = function(core, req, custom, body) {
        this._core = core;
        this._req = req;
        this._custom = custom; // used to override data
        this._body = body;
    };

    obj.prototype = $.extends('!base', {
        /**
         * url resolved
         *
         * @returns {obj.url|Function|string|*|string}
         */
        url: function() {
            var url = ($.defined(this._custom.url) ? this._custom.url : this._req.url).split('?')[0];
            return (('/' + url).replace(/\/{2,}/g, '/'));
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
         * Return the headers for the request
         */
        headers: function () {
            return this._req.headers;
        },

        /**
         * Return the token for the request
         */
        token: function () {
            return this._req.headers && this._req.headers['authorization'] ? this._req.headers['authorization'] : '';
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
         * Get remote info on client
         *
         * @returns {{ip: *}}
         */
        remote: function() {
            return ({
                ip: this._req.connection.remoteAddress
            });
        },

        rawData: function() {
            return (this._body.raw);
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

            for (var i in this._body.parsed) {
                data[i] = this._body.parsed[i];
            }

            return (data);
        }
    });

    module.exports = obj;
});