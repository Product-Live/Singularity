"use strict";

$.require([
    'core!/lib/file/fs.js',
    'core!/lib/file/util.js',
    'node!https',
    'node!http',
    'node!path',
    'node!crypto'
], function(
    fs,
    util,
    https,
    http,
    path,
    crypto
) {

	var obj = function() {};
	obj.prototype = $.extends('!base', {
        fs: fs,

        path: {
			name: function(path) {
                if (!$.is.string(path)) {
                    throw new Error('arument needs to be a string');
                }
                path = this.normalize(path);
                var a = path.split('.');
                return (a[a.length - 1]);
            },
            extension: function(p, ext) {
                if (!$.is.string(p)) {
                    throw new Error('arument needs to be a string');
                }
                p = this.normalize(p);
                p = (p = p.split('!'), p[p.length - 1]);
                return (path.basename(p, ext));
            },
            normalize: function(path) {
                if (!$.is.string(path)) {
                    throw new Error('arument needs to be a string');
                }
                return (path.replace(/(\/|\\){1,}/g, '/'));
            },
            parse: function(file) {
                if (!$.is.string(file)) {
                    throw new Error('arument needs to be a string');
                }
                return (path.parse(this.normalize(file)));
            }
		},

        /**
         * Create a directory newPath
         *
         * @param  {[type]} path [description]
         * @param  {[type]} mode [description]
         * @return {[type]}      [description]
         */
        create: function(path, mode) {
            path = util.arrayPath(path);
            var run = function(i) {
                var p = path.slice(0, i).join('/');
                return (fs.stat(p).then(function() {
                    return ((i > path.length) ? true : run(i + 1));
                }, function() {
                    return (fs.mkdir(p, mode).then(function() {
                        return ((i >= path.length) ? true : run(i + 1));
                    }, function() {
                        return (true);
                    }));
                }));
            };
            return (run(1));
        },

        /**
         * Remove folder and files a given path
         *
         * @param  {[type]} path [description]
         * @return {[type]}      [description]
         */
        remove: function(path) {
            path = $.path(path);
            const self = this;
            return fs.stat(path).then(function(stat) {
                if (stat.isDirectory()) {
                    return (fs.readDir(path).then(function(res) {
                        var wait = [];
                        for (var i in res) {
                            wait.push(self.remove(path + '/' + res[i]));
                        }
                        return ($.all(wait));
                    }).then(function() {
                        return (fs.rmDir(path));
                    }));
                } else {
                    return (fs.unlink(path));
                }
            }, function() {
                return (true);
            })
        },

        /**
         * test access rights
         *
         * @param  {[type]} path   [description]
         * @param  {[type]} option [description]
         * @return {[type]}        [description]
         */
        access: function(path, option) {
            return (fs.access($.path(path), option));
        },

        /**
         * fetch stat of folder or file
         *
         * @param  {[type]} path   [description]
         * @param  {[type]} option [description]
         * @return {[type]}        [description]
         */
        stat: function(path, option) {
            return (fs.stat($.path(path)));
        },

        /**
         * read into memory (for small file use streams are better)
         *
         * @param  {[type]} path [description]
         * @param  {[type]} type [description]
         * @return {[type]}      [description]
         */
        read: function(path, type) {
            return (fs.readFile($.path(path), (type === null)? type : (type || 'utf8')));
        },

        /**
         * write to file from memory (this can be done with a stream)
         *
         * @param  {[type]} path   [description]
         * @param  {[type]} data   [description]
         * @param  {[type]} option [description]
         * @return {[type]}        [description]
         */
        write: function(path, data, option) {
            return (fs.writeFile($.path(path), data, option));
        },

        /**
         * list files and folders at a path
         *
         * @param  {[type]} path [description]
         * @return {[type]}      [description]
         */
        list: function(path) {
            return (fs.readDir($.path(path)));
        },

        /**
         * copy file or folder to a given path
         *
         * @param  {[type]} oldPath [description]
         * @param  {[type]} newPath [description]
         * @return {[type]}         [description]
         */
        copy: function(oldPath, newPath) {
            var self = this;
            return (fs.stat(oldPath).then(function(stat) {
                if (stat.isDirectory()) {
                    return (fs.mkdir(newPath).then(function() {
                        return (fs.readDir(oldPath));
                    }).then(function(res) {
                        var wait = [];
                        for (var i in res) {
                            wait.push(self.copy(oldPath + '/' + res[i], newPath + '/' + res[i]));
                        }
                        return ($.all(wait));
                    }));
                } else {
                    var s = fs.createReadStream(oldPath).pipe(fs.createWriteStream(newPath)), p = $.promise();
                    s.on('error', function(err) {
                        p.reject(err)
                    }).on('close', function () {
                        p.resolve(newPath);
                    });
                    return (p);
                }
            }, function(err) {
                return ($.promise().reject(err));
            }));
        },

        /**
         * download a file by stream from a given url
         *
         * @param  {[type]} url  [description]
         * @param  {[type]} path [description]
         * @return {[type]}      [description]
         */
        download: function(url, path) {
            var p = new $.promise();
            ((/^https/.test(url))? https : http).get(url, function(res) {
                var file = fs.createWriteStream($.path(path)), data = function(d) {
                    file.write(d);
                };
                res.on('data', data).once('end', function() {
                    res.removeListener('data', data);
                    p.resolve(path);
                }).once('error', function(e) {
                    res.removeListener('data', data);
                    p.reject(e);
                })
            });

            return (p);
        },

        /**
         * hash a file by stream
         *
         * @param  {[type]} path [description]
         * @param  {[type]} type [description]
         * @return {[type]}      [description]
         */
        hash: function(path, type) {
            var p = new $.promise();
            var hash = crypto.createHash(type || 'sha256'), stream = fs.createReadStream($.path(path), {});

            stream.on('data', function (data) {
                hash.update(data, 'utf8')
            });
            stream.on('end', function () {
                p.resolve(hash.digest('hex'));
            });

            return (p);
        }
	});

	module.exports = obj;
});
