"use strict";

var start = function() {
    var config = {};

    var check = [
        'project!resources',
        'resources!/cache/module',
        'resources!/cache',
        'resources!/logs',
        $.config.get('server.http.tmpPath')
    ], run = function(i) {
        if (!$.defined(check[i])) {
            return (true);
        }
        return ($.file.create(check[i]).then(function() {
            return (run(i + 1));
        }))
    };

    return ($.all([
        $.file.remove('resources!/cache/gzip/')
    ]).then(function() {
        return (run(0));
    }).then(function() { // init machine session
        var sessionPath = $.config.get('require.path.resources') + '/.machineSession';
        return ($.file.read(sessionPath).then(function(res) {
            return (res.toString());
        }, function() {
            var key = $.key.number();
            return ($.file.write(sessionPath, key).then(function() {
                return (key);
            }, function() {
                return ('');
            }));
        }));
    }).then(function(key) {
        config.session = key;
        return (true);
    }).then(function() {
        var npm = new ($.require('core!/npm.js'))();

        return (npm.update().then(function() {
            ($.require('core!/global.js')).npm();
            return (config);
        }));
	}));
};

module.exports = start;
