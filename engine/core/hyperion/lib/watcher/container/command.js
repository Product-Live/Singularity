"use strict";

$.require([
    'hyperion!/lib/docker/format.js'
], function(
    _
) {

    var obj = function(conf) {
        this._container = conf;
    };
    obj.prototype = $.extends('hyperion!/lib/docker/base.js', {
        path: function(str) {
            return (_.version(this._securePath(str)));
        },
        keyChain: function(str) {
            var a = str.split('keychain!');
            if (a.length > 1) {
                return ((this._hide) ? '****' : _.escape($.keychain.get(a[1])));
            } else {
                return (_.escape(str));
            }
        },
        hasNetwork: function() {
            if (this._container.meta && $.defined(this._container.meta.network) && (this._container.meta.network != '' || this._container.meta.network != 'default') && process.platform != 'win32') {
                return (this._container.meta.network);
            }
            return (null);
        },

        name: function() {
            return ('--name ' + _.alpha(this._container.key));
        },
        env: function() {
            var env = this._container.env, e = '';
            for (var i in env) {
                e += '-e "' + _.escape(i) + '=' + (($.is.object(env[i])) ? _.escape($.json.encode(env[i])) : this.keyChain(env[i])) + '" '; //-
            }
            return (e.trim());
        },
        volume: function() {
            var volume = this._container.volume, e = '';
            for (var i in volume) {
                e += '-v ' + this.path(volume[i].src) + ':' + this.path(volume[i].dest, true) + ' ';
            }
            return (e.trim());
        },
        port: function() {
            if (this.hasNetwork()) {
                return ('');
            }
            var port = this._container.port, e = '';
            for (var i in port) {
                e += '-p ' + (parseInt(i) || 0) + ':' + (parseInt(port[i]) || 0) + ' ';
            }
            return (e.trim());
        },
        link: function() { // link hosts (added into the host file for the container)
            if (this.hasNetwork()) {
                return ('');
            }
            var link = this._container.link, e = '';
            for (var i in link) {
                if ($.is.object(link[i])) {
                    e += '--link ' + _.alpha(link[i].origin) + ':' + _.alpha(link[i].name) + ' ';
                } else {
                    e += '--link ' + _.alpha(link[i]) + ':' + _.alpha(link[i]) + ' ';
                }
            }
            return (e.trim());
        },
        network: function() {
            var a = null;
            if ((a = this.hasNetwork())) {
                return (('--network=' + a).trim());
            }
            return ('');
        },
        extra: function() {
            return ('');
        },

        create: function(hash) {
            var c = ['network', 'name', 'env', 'volume', 'port', 'link'], mid = '';

            var first = true;
            for (var i in c) {
                var v = this[c[i]]().trim() + ((c[i] == 'env')? ' -e "_lUGijN1Zkv' + (hash || '') + '=DSnjUoxRSG"' : '');
                mid += ((first || v == '')? '' : ' ') + v;
                first = false;
            }

            return ('docker run -d ' + mid.trim() + ' ' + (this.path(this._container.image) + ':' + _.version(this._container.version)).trim());
        },

        getHash: function() {
            return ($.crypto.hash(this.create('')));
        },

        get: function(hide) {
            this._hide = hide ||false;
            return (this.create(this.getHash()));
        }
    });

    module.exports = obj;
});