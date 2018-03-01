"use strict";

$.require([
	'lib!/console/logger/save/base',
    'node!fs'
], function(
	base,
    fs
) {

	var obj = function(config) {
		this._config = config || {};
	};
	obj.prototype = $.extends(base, {
        _fd: {},
        _fdPromise: {},
        init: function() {
            var self = this, path = this._config.path + '/' + this._config.name + '.log';
            if (!this._fd[path]) {
                console.log(path);
                self._fd[path] = fs.createWriteStream(path, {'flags': 'a'});
                self._fd[path].on('error', function(err) {
                    console.log('log error', err);
                });
            }
            return ($.promise().resolve(this._fd[path]));
        },

		save: function(data) {
            var fd = null;
            return (this.init().then(function(res) {
                var p = new $.promise();
                fd = res;
                res.write($.json.encode(data) + '\n', function(err) {
                    if (err) {
                        console.log('logs where not saved', err);
                        p.reject();
                    } else {
                        p.resolve();
                    }
                });
                return (p);
            }).then(function() {
                return (true);
            }, function() {
                return (true);
            }));
		},

        close: function() {
            var wait = [];
            for (var i in this._fd) {
                this._fd[i].end();
            }
            return ($.all(wait));
        }
	});

	module.exports = obj;
});