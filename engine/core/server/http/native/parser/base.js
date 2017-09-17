"use strict";

$.require([
    //
], function(
    //
) {

    var obj = function() {};
    obj.prototype = $.extends('!base', {
        createBuffer: function() {
            return (Buffer.alloc(Math.min(Number(this._req.headers['content-length']) || 0, this._max)));
        },
        fetch: function() {
            var body = this.createBuffer(), self = this, p = new $.promise();

            this._req.on('data', function(data) {
                body += data;

                if (body.length > self._max) {
                    self._req.connection.end('HTTP/1.1 413 Request Entity Too Large\r\n\r\n');
                }
            }).on('end', function() {
                p.resolve(body);
            });

            return (p);
        }
    });

    module.exports = obj;
});