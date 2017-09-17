"use strict";

var fs = require('fs');

var obj = function() {
    this._cache = {};
    this._debug = true; // other way to stop it better to us the one in require
};
obj.prototype = {
    _log : [],
    _stream: null,
    dump: function() {
        /*var fs = require('fs');
        fs.writeFileSync(appRoot + '.report.json', JSON.stringify(this._log));*/
        //this._steam.end('done');
    },
    _write: function(data) {
        if (!this._stream) {
            this._stream = fs.createWriteStream(appRoot + '/app/resources/.report.json', {'flags': 'a'});
        }
        this._stream.write(data);
    },
    _hasProto: function(out) {
        for (var i in out) {
            return (true);
        }
        return (false);
    },
    _getTime: function(time) {
        var diff = process.hrtime(time);
        return (diff[0] * 1e9 + diff[1])
    },
    _skip: {},
    _hook: function(path, self, out) {
        var s = this;
        return (function() {
            var time = process.hrtime();
            var a = out.apply(this, arguments);

            var stack = s._skip[path];
            if (typeof(s._skip[path]) === 'undefined') {
                stack = (s._skip[path] = (path.match(appRoot) && !path.match(/node_modules/)))
            }
            
            if (typeof(a) == 'object' && typeof(a.then) === 'function') {
                a.then(function(res) {
                    s._write(JSON.stringify({
                            async: true,
                            stack: (stack)? new Error().stack.split('\n').splice(2, 5) : '_skip_',
                            path: path,
                            scale: {start: time, end: process.hrtime()},
                            nano: s._getTime(time)
                    }) + '\n');
                    return (res);
                }, function(res) {
                    s._write(JSON.stringify({
                            async: true,
                            stack: (stack)? new Error().stack.split('\n').splice(2, 5) : '_skip_',
                            path: path,
                            scale: {start: time, end: process.hrtime()},
                            nano: s._getTime(time)
                    }) + '\n');
                    return (this.reject(res));
                });

                return (a);
            }

            s._write(JSON.stringify({
                    async: false,
                    stack: (stack)? new Error().stack.split('\n').splice(2, 5) : '_skip_',
                    path: path,
                    scale: {start: time, end: process.hrtime()},
                    nano: s._getTime(time)
            }) + '\n');
            return (a);
        });
    },

    wrap: function(path, out) {
        if (!this._cache[path] && !path.match(/^node\!/) && !path.match(/^npm\!/) && this._debug) {
            try {
                if (typeof(out) === 'function' && !this._hasProto(out.prototype) && !this._hasProto(out)) {
                    return (this._hook(path, out, out));
                }
                if (typeof(out) === 'function' && this._hasProto(out.prototype)) {
                    for (var i in out.prototype) {
                        if (typeof(out[i]) === 'function') {
                            out.prototype[i] = this._hook(path + ';' + i, out.prototype, out.prototype[i]);
                        }
                    }
                    return (out);
                }
                if (typeof(out) === 'object') {
                    for (var i in out) {
                        if (typeof(out[i]) === 'function') {
                            out[i] = this.wrap(path + ';' + i, out[i]);
                        }
                    }
                    return (out);
                }
            } catch(e) {
                console.log('skip hook', path);
            }
            this._cache[path] = true;
            this._cache[path.split(';')[0]] = true;
        }

        return (out);
    }
};

module.exports = obj;