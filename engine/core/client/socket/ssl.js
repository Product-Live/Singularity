"use strict";

$.require([
    'node!tls',
    'core!/cert.js',
    'node!fs'
], function(
    tls,
    cert,
    fs
) {

    var obj = function(callback, config) {
        this._callback = callback;
        this._reboot = true;
        this._running = false;
        this._uptime = $.time.now().get;
        this._name = config;
        this._config = $.config.get('socket.' + config);
        this._error = null;

        var self = this;
        $.all([
            cert.public($.config.get('env.cert')),
            cert.private($.config.get('env.cert')),
            cert.public(self._config.ip)
        ]).then(function(res) {
            self._options = {
                host: self._config.ip,
                port: self._config.port,
                key: res[1],
                cert: res[0],
                rejectUnauthorized: true,
                ca: [res[2]]
            };

            return (self._connect());
        });
    };

    obj.prototype = $.extends('!base', {
        _connect: function() {
            var self = this, reco = false;

            //console.log('try connecte');
            if (this._socket) {
                this._socket.end();
            }

            //console.log('connecte', this._config);

            this._socket = tls.connect(this._options, function(s) {
                console.log('client connected', self._socket.authorized ? 'authorized' : 'unauthorized');
                self._error = null;
                if (self._socket.authorized) {
                    self._running = true;
                    self._socket.setKeepAlive(true, 60000);
                    self._socket.write(self._config.valid);
                }
            });
            this._socket.setEncoding('utf8');
            this._socket.on('data', function(data) {
                self._callback(data);
            });
            this._socket.on('closed', function() {
                console.log('closed');
                self._running = false;
                if (self._reboot && !reco) {
                    reco = true;
                    setTimeout(function () {
                        self._connect();
                    }, self._config.timeout)
                }
                console.log('closed');
            });
            this._socket.on('end', function() {
                console.log('end');
                self._running = false;
                if (self._reboot && !reco) {
                    reco = true;
                    setTimeout(function () {
                        self._connect();
                    }, self._config.timeout)
                }
                console.log('closed');
            });
            this._socket.on('error', function(err) {
                var key = err.toString();
                if (self._error != key) {
                    //console.log('socket', self._config, err);
                    self._error = key;
                }
                self._running = false;
                if (self._reboot && !reco) {
                    reco = true;
                    setTimeout(function () {
                        self._connect();
                    }, self._config.timeout)
                }
            });
        },

        upTime: function() {
            return (this._uptime);
        },

        /**
         * Send socket packet (no idea how node handles the packets to flush on disconnect)
         *
         * @param data
         * @returns {promise}
         */
        send: function(data) {
            var self = this, p = new $.promise();

            if (this._running) {
                this._socket.write(($.is.object(data)) ? $.json.encode(data) : data, function() {
                    p.resolve();
                });
            } else {
                p.resolve();
            }
            return (p);
        },

        once: function(event, func) {
            this._socket.once(event, func);
            return (this);
        },
        
        shutdown: function() {
            this._reboot = false;
            if (this._socket) {
                this._socket.end();
            }
            return ($.promise().resolve());
        }
    });

    module.exports = obj;
});