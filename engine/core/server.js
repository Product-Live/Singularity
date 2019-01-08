"use strict";

$.require([
    //
], function(
    //
) {

    var obj = function() {
        this._handle = [];

        this._map = {
            http: {
                native: $.require('core!server/http/native.js')
            },
            socket: {
                native: $.require('core!server/socket/native.js')
            },
            webSocket: {
                native: $.require('core!server/webSocket/native.js')
            }
        }
    };

    obj.prototype = $.extends('!base', {
        /**
         * Create a base object to run off
         *
         * @param a
         * @param b
         * @returns {{type: *, param: (*|{})}}
         * @private
         */
        _arguments: function(a, b) {
            return ({
                type: (!$.defined(a) || $.is.object(a)) ? 'native' : a,
                param: (($.is.object(a)) ? a : b) || {}
            });
        },

        /**
         * Create a http server
         *
         * @param a
         * @param b
         * @returns {*}
         */
        http: function(a, b) {
            var arg = this._arguments(a, b);

            if ($.defined(this._map.http[arg.type])) {
                return (new this._map.http[arg.type](arg.param));
            }
            throw new Error('no http wrapper found with that type name');
        },

        /**
         * Create a webSocket server
         *
         * @param a
         * @param b
         * @returns {*}
         */
        webSocket: function(a, b) {
            var arg = this._arguments(a, b);
            if ($.defined(this._map.webSocket[arg.type])) {
                return (new this._map.webSocket[arg.type](arg.param));
            }
            throw new Error('no webSocket wrapper found with that type name');
        },

        /**
         * Create a socket server
         *
         * @param a
         * @param b
         * @returns {*}
         */
        socket: function(a, b) {
            var arg = this._arguments(a, b);

            if ($.defined(this._map.socket[arg.type])) {
                return (new this._map.socket[arg.type](arg.param));
            }
            throw new Error('no socket wrapper found with that type name');
        }
    });

    module.exports = obj;
});