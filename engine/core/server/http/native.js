"use strict";

$.require([
    'node!http',
    'node!https',
    'node!path',
    'core!/server/http/native/wrapper/response.js',
    'core!/server/http/native/wrapper/request.js',
    'core!/server/http/native/wrapper/callback.js',
    'core!/server/http/native/partition.js',
    'core!/server/http/native/parser.js',
    'core!/server/http/native/tarPit.js'
], function(
    http,
    https,
    path,
    response,
    request,
    callback,
    partition,
    parser,
    tarPit
) {

    var obj = function() {
        this._server = [];
        this._socket = [];
        this._callback = [];
        this._match = [];
        this.init();
    };
    obj.prototype = $.extends('!base', {
        /**
         * Hook onto open socket to close them on graceful shutdown
         *
         * @param i
         * @private
         */
        _hookSockets: function(i) {
            var self = this;
            this._server[i].on('connection', function(socket) {
                var id = $.key.number();
                self._socket.push({
                    id: id,
                    server: i,
                    socket: socket
                });

                socket.once('close', function() {
                    for (var i in self._socket) {
                        if (self._socket[i].id == id) {
                            self._socket.splice(i, 1);
                        }
                    }
                });
            });
        },

        /**
         * Shutdown server with array key
         *
         * @param id
         * @returns {*}
         * @private
         */
        _close: function(id) {
            var p = new $.promise();

            this._server[id].close(function() {
                p.resolve();
            });

            return (p);
        },

        /**
         * Process request before sending them on. Downloading the post message trying and parse based on the content-type
         *
         * @param req
         * @param res
         * @private
         */
        _processRequest: function(req, res) {
            var t = new tarPit(req, res);
            if (t.isAttack()) {
                return (t.random());
            }
            req.url = path.normalize(req.url).replace(/\\/g, '/').replace(/^(\.\.[\/\\])+/, '');

            var self = this, body = new parser(req, res);
            body.get().then(function(body) {
                var found = false;

                for (var i in self._match) {
                    if (req.url.match(self._match[i].match)) {
                        self._match[i].callback.apply(new callback(this, res, req), [
                            (new request(self, req, {}, body)),
                            (new response(self, res, req))
                        ]);
                        return (true);
                    }
                }

                for (var i in self._callback) {
                    if ($.is.function(self._callback[i].run) && !found) {
                        if ((found = self._callback[i].run(req, res, self) || found)) {
                            self._callback[i].func().apply(new callback(this, res, req), [
                                (new request(self, req, found, body)),
                                (new response(self, res, req))
                            ]);
                            break;
                        }
                    }
                }

                if (!found) {
                    res.writeHead((req.url == '/') ? 200 : 404, {
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
                        "Access-Control-Allow-Headers": "Cache-Control, Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
                    });
                    res.end((req.url == '/') ? '' : '{"error":404,"msg":"partition not found."}');
                }
            });
        },

        /**
         * Startup servers based on config
         *
         * @returns {boolean}
         */
        init: function() {
            if (this._server.length > 0) {
                return (false);
            }

            var self = this, config = $.config.get('server.http');
            if (config.ssl) {
                // redirect to https
                this._server.push(http.createServer(function(req, res) {
                    res.writeHead(301, {
                        'Content-Type': 'text/plain',
                        'Location': 'https://' + req.headers.host + ':' + config.sslPort + req.url
                    });
                    console.log('goto', 'https://' + req.headers.host + ':' + config.sslPort + req.url);
                    res.end('Redirecting to SSL\n');
                }).listen(config.port));

                this._server.push(https.createServer({
                    key: config.key,
                    cert: config.cert,
                    ca: config.ca,
                    ciphers: config.ciphers.join(':'),
                    honorCipherOrder: true
                }, function(req, res) {
                    self._processRequest(req, res);
                }).listen(config.sslPort, config.ip));
            } else {
                this._server.push(http.createServer(function(req, res) {
                    self._processRequest(req, res);
                }).listen(config.port, config.ip));
            }

            for (var i in this._server) {
                this._hookSockets(i);
            }

            return (true);
        },

        /**
         * Create a partition on the /cdn/.*
         *
         * @param callback
         * @returns {obj}
         */
        cdn: function(callback) {
            this._callback.push(new partition('cdn', callback));
            return (this);
        },

        /**
         * Create a partition on the /api/.*
         *
         * @param callback
         * @returns {obj}
         */
        api: function(callback) {
            this._callback.push(new partition('api', callback));
            return (this);
        },

        /**
         * Create a partition on the /api/.*
         *
         * @param match
         * @param callback
         * @returns {obj}
         */
        match: function(match, callback) {
            this._match.push({match: match, callback: callback});
            return (this);
        },

        /**
         * Shutdown graceful all http servers
         *
         * @returns {*}
         */
        shutdown: function() {
            if (this._server.length > 0) {
                return ($.promise().resolve());
            }

            for (var i in this._socket) {
                this._socket[i].socket.destroy();
            }
            var self = this, wait = [];
            for (var i in this._server) {
                wait.push(this._close(i));
            }
            return ($.all(wait).then(function() {
                self._server = [];
                self._socket = [];
                return (true);
            }));
        }
    });

    module.exports = obj;
});