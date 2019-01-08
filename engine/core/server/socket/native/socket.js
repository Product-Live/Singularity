"use strict";

$.require([
    //
], function(
    //
) {

    var obj = function(socket, core) {
        this._socket = socket;
        this._core = core;
        this._id = $.key.plain();
        this._valid = false;
        this._key = this._core._config.valid;
        this._core._connected.push(this);
        this._closed = false;

        var self = this;
        this._socket.on('data', function(data) {
            if (self._valid) {
                self._core._received(self, data);
            } else {
                if (data == self._key) {
                    console.log($.color.green(self._id, ' is now valid'));
                    self._valid = true;
                }
            }
        }).on('close', function(data) {
            self._close();
        }).on('error', function(err) {
            console.log(err);
        }).on('end', function(data) {
            self._close();
        })
    };

    obj.prototype = $.extends('!base', {
        _close: function() {
            this._closed = true;
            for (var i in this._core._connected) {
                if (this._core._connected[i] && this._core._connected[i]._id == this._id) {
                    this._core._connected.splice(i, 1);
                    return (true);
                }
            }
            return (false);
        },

        send: function(data) {
            var p = new $.promise();
            if (this._closed) {
                p.reject();
            } else {
                this._socket.write(($.is.object(data)) ? $.json.encode(data) : data, function () {
                    p.resolve();
                });
            }
            return (p);

        },
        id: function()  {
            return (this._id);
        },

        shutdown: function() {
            this._socket.end();
        }
    });

    module.exports = obj;
});