"use strict";

$.require([
    //
], function(
    //
) {

    var obj = function(socket, data) {
        this._socket = socket;
        this._data = data || {};
    };
    obj.prototype = $.extends('!base', {
        auth: function() {
            return ((this._data.value || {}).authorization || '');
        },
        get: function() {
            return ((this._data.value || {}).data || {});
        },
        client: function() {
            return (this._socket);
        },
        url: function() {
            return (this._data.action);
        }
    });

    module.exports = obj;
});