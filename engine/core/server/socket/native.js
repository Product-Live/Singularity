"use strict";

$.require([
    'core!/server/socket/native/socket.js',
    'node!tls'
], function(
    socket,
    tls
) {

    var obj = function(config) {
        this._connected = [];
        this.server = true;
        this._uptime = $.time.now().get;
        this._name = config.name;
        this._config = $.config.get('socket.' + config.name);

        var self = this;
        /*$.all([
            cert.public(this._config.ip),
            cert.private(this._config.ip),
            cert.client()
        ]).then(function(res) {
            var ca = [];
            for (var i in res[2]) {
                ca.push(res[2][i].public);
            }
            self._options = {
                key: res[1],
                cert:  res[0],
                requestCert: true,
                rejectUnauthorized: false,
                ca: ca
            };
            self._start();
        });*/

    };

    obj.prototype = $.extends('!base', {
        _start: function() {
            var self = this;
            this._server = tls.createServer(this._options, function (s) {
                console.log('server connected', s.authorized ? 'authorized' : 'unauthorized');
                if (s.authorized) {
                    s.setEncoding('utf8');
                    new socket(s, self);
                }
            }).on('error', function (err) {
                console.log(err);
            });

            this._server.listen(this._config.port, '0.0.0.0', function () {
                console.log('opened server', self._name, self._config);
            });
        },
        _received: function(socket, data) {
            if ($.is.function(this._callback)) {
                this._callback(socket, data);
            }
        },

        api: function(callback) {
            this._callback = callback;
        },

        upTime: function() {
            return (this._uptime);
        },

        connected: function() {
            return (this._connected);
        },

        shutdown: function() {
            var p = new $.promise();
            for (var i in this._connected) {
                this._connected[i].shutdown();
            }
            if (this._server) {
                this._server.close(function () {
                    p.resolve();
                });
            }
            return (p);
        }
    });

    module.exports = obj;
});