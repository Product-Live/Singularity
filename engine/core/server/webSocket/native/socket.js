"use strict";

$.require([
    //
], function(
    //
) {

    var obj = function(socket) {
        this._socket = socket;
        this._id = $.key.short();
        this._closed = false;
    };
    obj.prototype = $.extends('!base', {
        isOpen: function() {
            return (!this._closed);
        },
        send: function(data) {
            var p = new $.promise();

            if (this._closed) {
                return (p.reject());
            }

            this._socket.send($.json.encode({type: 'packet', data: data}), function() {
                p.resolve();
            });

            return (p);
        },
        id: function() {
            return (this._id);
        },
        close: function() {
            try { this._socket.close(); } catch (e) {}
            this._closed = true;
        }
    });

    module.exports = obj;
});