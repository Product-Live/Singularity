"use strict";
$.require([
    'core!think.js',
    'npm!request',
    'hyperion!/discovery.js'
], function(
    think,
    request,
    discovery
) {

	var obj = function(core) {
        this._core = core;
        this._config = $.config.get('ca.remote');
        this._test = {};

        var self = this;
        request.get({
            url: 'http://ipinfo.io/ip'
        }, function(err, response, body) {
            self._ip = (body.match(/(\d{1,3}\.){3}\d{1,3}/)[0] || '').trim();
            if (self._ip === '') {
                self._ip = null;
            }
            console.log(err, body, self._ip);
            self._think = new think(function() {
                return (self.run().then(function() {
                    return (self._send());
                }));
            }, $.time.second(1));
        });
	};
	obj.prototype = {
        _map: {},
        _send: function(data) {
            var p = $.promise();
            request.post({
                url: 'https://' + this._config.host + ':' + this._config.port + '/pl/ca/sdp',
                headers: {
                    'Authorization': this._config.tokken
                },
                json: true,
                ca: $.config.get('server.http.cert'),
                body: {service: data}
            }, function(err, response, body) {
                //console.log(err, body);
                p.resolve();
            });
            return (p);
        },
        run: function() {
            var self = this;

            for (var i in this._core._container) {
                var d = this._core._container[i]._container();
                if (discovery.get(d.image) && d.active && !d.endPoint.match(/(localhost|docker):\d+/)) {
                    if (!this._test[d.endPoint]) {
                        (function (d) {
                            self._test[d.endPoint] = true;
                            var out = {}, end = (d.endPoint || '').replace(/https*:\/\//g, '').split(':'), https = (d.endPoint.match(/https*:\/\//));
                            if (!$.defined(end[1])) {
                                return;
                            }

                            var ip = ((https)? 'https://' : 'http://') + (self._ip || end[0]) + ':' + end[1];
                            discovery.get(d.image).test(self._core._config.map.name, ip, d).then(function(res) {
                                res.endpoint = ip;
                                out[ip] = res;
                                console.log(out);
                                return (self._send(out));
                            }).then(function() {
                                setTimeout(function() {
                                    self._test[d.endPoint] = false;
                                }, 2000);
                            });
                        })(d);
                    }
                }
            }

            return ($.promise().resolve());
        },
        shutdown: function() {
            this._think.stop();
        }
	};

	module.exports = obj;
});