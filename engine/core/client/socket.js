"use strict";

$.require([
    'core!client/socket/ssl.js'
], function(
    ssl
) {

    var obj = function(callback, config) {
        this._handle = new ssl(callback, config);
    };

    obj.prototype = $.extends('!base', {
        upTime: function() {
            return (this._handle.upTime());
        },

        send: function(data) {
            return (this._handle.send(data));
        },

        once: function(event, func) {
            return (this._handle.once(event, func));
        }
    });

    module.exports = obj;
});