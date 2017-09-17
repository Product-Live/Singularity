"use strict";

var fs = require('fs');
var Console = require('console').Console;

var obj = function() {
    this._origin = {};
    this._overload = null;
    this._config = null;
    for (var i in console) {
        this._origin[i] = console[i];
        console[i] = this._console(i);
    }
    this._stream = null;
};
obj.prototype = {
    _console: function(key) {
        var self = this;
        return (function() {
            if (self._config) {
                return (self._log(key, arguments));
            } else {
                return (self._origin[key].apply(self._origin[key], arguments));
            }
        });
    },

    _log: function(key, arg) {
        if (!this._overload) {
            if (!this._stream) {
                this._stream = {
                    out: fs.createWriteStream(appRoot.absolute + '/' + this._config.path + 'out'),
                    err: fs.createWriteStream(appRoot.absolute + '/' + this._config.path + 'err')
                };
            }
            this._overload = new Console(this._stream.out, this._stream.err);
        }

        this._origin[key].apply(this._origin[key], arg);
        return (this._overload[key].apply(this._overload[key], arg));
    },

    log: function(param) {
        this._config = param;
    }
};

module.exports = obj;
