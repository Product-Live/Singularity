"use strict";

$.require([
    'core!/server/http/native/wrapper/file.js',
    'node!querystring'
], function(
    file,
    queryString
) {

    var obj = function(req, res) {
        this._req = req;
        this._res = res;
    };
    obj.prototype = $.extends('!base', {
        _chunkInfo: function(chunk) {
            var info = {}, raw = chunk['Content-Disposition'].split('; ');
            for (var i in raw) {
                var row = raw[i].trim().split(/(="|")/);
                info[row[0]] = row[2]
            }
            return (info);
        },

        _getPosition: function(str, m, i) {
            return (str.split(m, i).join(m).length);
        },

        _getChunk: function(body, end, i, max) {
            var x = this._getPosition(body, end, i), y = ((Number(i) + 1) < max) ? this._getPosition(body, end, Number(i) + 1) : body.length;
            return (body.substring(x, y));
        },

        _saveFile: function(info, data) {
            var path = $.config.get('server.http.tmpPath') + $.key.plain() + '.' + $.file.path.extension(info.filename);
            return ($.file.write(path, data, 'binary').then(function() {
                return ({
                    key: info.name,
                    path: path,
                    fileName: info.filename
                })
            }, function(err) {
                return ($.promise().reject(err));
            }));
        },

        get: function() {
            var req = this._req, self = this, p = new $.promise();
            req.setEncoding('binary');

            var body = '', binaryEnd, first = true;
            req.on('data', function(data) {
                if (first) {
                    binaryEnd = data.toString().substring(0, data.toString().indexOf('\n') - 1);
                }
                first = false;
                body += data
            });

            var out = {}, wait = [];
            req.on('end', function() {
                var part = body.split(binaryEnd);

                for (var i in part) {
                    if ($.is.not(part[i], ['', '--\r\n'])) {
                        var chunk = queryString.parse(part[i], '\r\n', ':');

                        if (chunk['Content-Disposition']) {
                            var info = self._chunkInfo(chunk);
                            if (chunk['Content-Type']) {
                                var contentType = chunk['Content-Type'].substring(1);
                                var t = self._getChunk(body.toString(), binaryEnd, i, part.length);

                                //Get the location of the start of the binary file,
                                //which happens to be where contentType ends
                                var shorterData = t.substring(t.indexOf(contentType) + contentType.length);

                                //replace trailing and starting spaces
                                wait.push(self._saveFile(info, shorterData.replace(/^\s\s*/, '').replace(/\s\s*$/, '')).then(function(res) {
                                    out[res.key] = new file({
                                        path: res.path,
                                        fileName: res.fileName
                                    });
                                    return (true);
                                }));
                            } else {
                                var t = self._getChunk(body.toString(), binaryEnd, i, part.length);
                                out[info.name] = t.split('name="' + info.name + '"')[1].trim();
                            }
                        }
                    }
                }

                $.all(wait).then(function() {
                    p.resolve({parsed: out, raw: null});
                }, function(err) {
                    p.reject(err);
                })
            });

            return (p);
        }
    });

    module.exports = obj;
});