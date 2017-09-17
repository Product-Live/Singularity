"use strict";

$.require([
    'node!zlib',
    'node!fs',
    'core!mime.js'
], function(
    zlib,
    fs,
    mime
) {

    var obj = function(res, req, data) {
        this._res = res;
        this._req = req;
        this._data = data;
        this._key = $.crypto.hash($.path(this._data.path));
        this._encode = (this._req.headers['accept-encoding'] || '').match('gzip') ? 'gzip' : null;
    };
    obj.prototype = $.extends('!base', {
        _cacheSize: {},

        _createStream: function() {
            var stream = fs.createReadStream($.path(this._data.path), {autoClose: true});
            this._res.once('error', function() {
                stream.end();
            });
            if (this.encode()) {
                return (stream.pipe(zlib.createGzip()));
            } else {
                return (stream);
            }
        },

        _gzipSize: function() {
            var stream = fs.createReadStream($.path(this._data.path), {autoClose: true}), size = 0, p = $.promise(), self = this;
            var data = function(chunk) {
                size += chunk.length;
            };
            stream.pipe(zlib.createGzip()).on('data', data).once('end', function() {
                stream.removeListener('data', data);
                p.resolve((self._cacheSize[self._key] = size));
            }).once('error', function() {
                stream.removeListener('data', data);
                p.resolve(0);
            });
            return (p);
        },

        context: function() {
            return (mime.lookup(this._data.path, 'text/html'));
        },

        encode: function() {
            return (this._encode);
        },

        size: function() {
            if (this.encode()) {
                return (this._cacheSize[this._key] || this._data.stats.size);
            }
            return (this._data.stats.size);
        },

        stream: function() { // the cached size fucks up for some reason
            if (this.encode()/* && !this._cacheSize[this._key]*/) {
                var self = this;
                return (this._gzipSize().then(function() {
                   return (self._createStream());
                }));
            }
            return ($.promise().resolve(this._createStream()));
        }
    });

    module.exports = obj;
});