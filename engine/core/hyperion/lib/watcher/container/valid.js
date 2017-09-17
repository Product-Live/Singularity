"use strict";

$.require([
    //
], function(
    //
) {

    var obj = function(core) {
        this._core = core;
    };
    obj.prototype = $.extends('hyperion!/lib/docker/base.js', {
        _container: function() {
            return (this._core._container());
        },

        _hasNetwork: function() {
            var inspect = this._container().inspect;
            if (inspect && process.platform != 'win32') {
                if ($.defined(inspect.HostConfig.NetworkMode) && (inspect.HostConfig.NetworkMode != '' || inspect.HostConfig.NetworkMode != 'default')) {
                    return (inspect.HostConfig.NetworkMode);
                }
            }
            return (null);
        },

        /**
         * Do the ports match up on the container?
         *
         * @param inspect
         * @returns {{error: string}}
         * @private
         */
        _port: function(inspect) {
            if (this._hasNetwork()) {
                return (true);
            }

            var ports = {
                map: this._container().port || {},
                remote: inspect.NetworkSettings.Ports, // inspect.HostConfig.PortBindings,
                count: {
                    map: 0,
                    remote: 0
                },
                valid: true
            };
            if ($.defined(ports.remote)) {
                for (var i in ports.map) {
                    if (!$.defined(ports.remote[ports.map[i] + '/tcp']) || ports.remote[ports.map[i] + '/tcp'][0].HostPort != i) {
                        ports.valid = false;
                        if ($.defined(ports.remote[ports.map[i] + '/tcp'])) {
                            console.log(ports.map[i] + '/tcp', $.defined(ports.remote[ports.map[i] + '/tcp']), ports.remote[ports.map[i] + '/tcp'], i);
                        } else {
                            console.log(ports.map[i] + '/tcp', false);
                        }
                        break;
                    } else {
                        ports.count.map += 1;
                    }
                }
                for (var i in ports.remote) {
                    ports.count.remote += 1;
                }
            }

            if (!ports.valid || ports.count.remote != ports.count.map) {
                return ({error: 'port count does not match up count:' + ports.count.map + ' max:' + ports.count.remote + ' fault found ' + (ports.valid ? 'true' : 'false')});
            }
            return (true);
        },

        /**
         * Does the container have the override for the env values?
         *
         * @param inspect
         * @returns {{error: string}}
         * @private
         */
        _env: function(inspect) {
            //has env set
            var envMap = {}, env = this._container().env, envMax = 0, envCount = 0;
            for (var i in env) {
                envMap[i + '=' + (($.is.object(env[i])) ? $.json.encode(env[i]) : env[i])] = true;
                envMax += 1;
            }
            for (var i in inspect.Config.Env) {
                if ($.defined(envMap[inspect.Config.Env[i]])) {
                    envCount += 1;
                }
            }

            if (envCount != envMax) {
                return ({error: 'missing env config found:' + envCount + ' config:' + envMax});
            }
            return (true);
        },

        _createCommand: function(hash) {
            var self = this, inspect = this._container().inspect;

            var c = {
                name: '--name ' + inspect.Name.substring(1),

                env: (function() { // env
                    var env = inspect.Config.Env, mapE = self._container().env, e = '';
                    for (var i in env) {
                        if (mapE[env[i].split('=')[0]]) {
                            var tmp = env[i].replace(/\\/g, "\\\\").replace(/\$/g, "\\$").replace(/'/g, "\\'").replace(/"/g, "\\\"");
                            e += '-e "' + tmp + '" ';
                        }
                    }
                    return (e.trim());
                })(),

                volume: (function() { // volume
                    var volume = inspect.Mounts, volumeE = self._container().volume, e = '';
                    for (var i in volume) {
                        for (var x in volumeE) {
                            if (self._securePath(volumeE[x].src) == self._securePath(volume[i].Source)) {
                                e += '-v ' + self._securePath(volume[i].Source) + ':' + self._securePath(volume[i].Destination, true) + ' ';
                                break;
                            }
                        }
                    }
                    return (e.trim());
                })(),

                port: (function() { // exposed ports
                    if (self._hasNetwork()) {
                        return ('');
                    }
                    var _port = inspect.NetworkSettings.Ports, port = {}, e = '';
                    for (var i in _port) {
                        port[i.replace('/tcp', '')] = _port[i][0].HostPort;
                    }
                    for (var i in port) {
                        e += '-p ' + port[i] + ':' + i + ' ';
                    }
                    return (e.trim());
                })(),

                link: (function() { // link hosts (added into the host file for the container)
                    if (self._hasNetwork()) {
                        return ('');
                    }
                    var link = inspect.HostConfig.Links, e = '';
                    for (var i in link) {
                        var l = link[i].split(':')
                        e += '--link ' + l[0].split('/')[1] + ':' + l[0].split('/')[1] + ' ';
                    }
                    return (e.trim());
                })(),

                network: (function() {
                    var a = null;
                    if ((a = self._hasNetwork())) {
                        return (('--network=' + a).trim());
                    }
                    return ('');
                })()
            }, mid = '';

            var first = true;
            for (var i in c) {
                var v = c[i].trim() + ((c[i] == 'env')? ' -e "_lUGijN1Zkv' + (hash || '') + '=DSnjUoxRSG"' : '');
                mid += ((first || v == '')? '' : ' ') + v;
                first = false;
            }

            return ('docker run -d ' + mid.trim() + ' ' + inspect.Config.Image);
        },

        /**
         * Is it the current run command the same?
         *
         * @private
         */
        _command: function() {
            var inspect = this._container().inspect;
            if (!$.defined(this._core._currentRun) && inspect) {
                var found = false, env = inspect.Config.Env, hash = '_lUGijN1Zkv' + this._core._runCommandHash() + '=DSnjUoxRSG';
                for (var i in env) {
                    if (hash == env[i]) {
                        found = true;
                        break;
                    }
                }

                if (found) {
                    this._core._currentRun = this._core._runCommand();
                    this._core._absoluteID = inspect.Id;
                } else {
                    this._core._currentRun = this._createCommand($.crypto.hash(this._createCommand('')));
                    this._core._absoluteID = inspect.Id;
                }
            }

            if (this._core._currentRun != this._core._runCommand()) {
                $.console.docker('command match failed', this._core._currentRun + '\n' + this._core._runCommand());
                return ({error: 'The start up commands do not match up with the map.'});
            }
            return (true);
        },


        /**
         * Is it running the correct image?
         *
         * @param inspect
         * @returns {{error: string}}
         * @private
         */
        _image: function(inspect) {
            if (inspect && inspect.Config.Image !== this._core._getImage()) {
                return ({error: 'wrong image container:' + inspect.Config.Image + ' config:' + this._core._getImage()});
            }
            return (true);
        },

        is: function() {
            var container = this._container();

            if (container.lastInspect != 0) {
                var inspect = container.inspect, run = ['_command', '_image', '_port', '_env'];

                for (var i in run) {
                    var tmp = this[run[i]](inspect);
                    if ($.is.object(tmp)) {
                        return (tmp);
                    }
                }

                return (true);
            }
            return ({error: 'no inspect'});
        }
    });

    module.exports = obj;
});