"use strict";

$.require([
    'core!bash.js'
], function(
    bash
) {

    var obj = function () {};
    obj.prototype = {
        _staticEnv: {
            envReady: false,
            env: {} // this can maybe be a static version of the env created
        },

        /**
         * Has git bash installed used to run bash commands on windows
         *
         * @returns {*}
         * @private
         */
        _hasGit: function () {
            var p = new $.promise();

            bash.run('echo "test";').then(function(res) {
                if (res.out.length == 1 && res.out[0] == 'test\n') {
                    p.resolve();
                } else {
                    p.reject(new Error('sh: wrong result from command.'));
                }
            }, function() {
                p.reject(new Error('sh: the sh command is not supported try adding "C:\Program Files\Git\bin" to the windows PATH.'));
            });

            return (p);
        },

        /**
         * Get the env needed to run in win32
         *
         * @returns {*}
         * @private
         */
        _loadEnv: function(force) {
            var p = new $.promise(), self = this, env = process.env, data = {
                VM: 'default'
            };

            if ((!self._staticEnv.envReady || force) && process.platform == 'win32') {
                console.log('init docker shell');

                self._hasGit().then(function() { // has git installed
                    return ($.all([ // is the toolbox installed
                        $.file.access((env.VBOX_MSI_INSTALL_PATH || env.VBOX_INSTALL_PATH) + 'VBoxManage.exe'),
                        $.file.access(env.DOCKER_TOOLBOX_INSTALL_PATH + '/docker-machine.exe')
                    ]));
                }, function(err) {
                    p.reject(err);
                }).then(function(res) {
                    data.VBOXMANAGE = res[0];
                    data.DOCKER_MACHINE = res[1];

                    var cache = ($.config.get('docker.env.cache') && !force) ? '' : $.time.now().get;
                    if (cache == '') {
                        console.log('look for cache in', $.config.get('docker.env.path'));
                    } else {
                        console.log('skip cache');
                    }

                    return ($.file.read($.config.get('docker.env.path') + cache).then(function (res) {
                        var json = $.json.decode(res);

                        if ($.defined(json) && $.is.object(json) && json.time > $.time.now().get) {
                            self._staticEnv.envReady = true;
                            console.log('docker env set from cache to', json.env, 'cached for', (new Date(json.time)).toString());
                            p.resolve((self._staticEnv.env = json.env));
                        } else {
                            return (bash.run('"' + data.VBOXMANAGE + '" list vms', null, true));
                        }
                    }, function() {
                        return (bash.run('"' + data.VBOXMANAGE + '" list vms', null, true));
                    }));
                }, function() {
                    p.reject(new Error('docker: The ToolKit is not installed or there was a error installing it.'));
                }).then(function(res) {
                    console.log(res);
                    if (res.code == 1 || res.out.length == 0 || ($.is.string(res.out[0]) && !res.out[0].match(data.VM))) {
                        return (bash.run('"' + data.DOCKER_MACHINE + '" rm -f ' + data.VM, null, true).then(function() {
                            return (bash.run('rm -rf ~/.docker/machine/machines/' + data.VM, null, true));
                        }, function (err) {
                            console.log('err', err);
                        }).then(function () {
                            return (bash.run('"' + data.DOCKER_MACHINE + '" create -d virtualbox ' + data.VM, null, true));
                        }, function (err) {
                            console.log('err4', err);
                        }));
                    } else {
                        return (bash.run('"' + data.DOCKER_MACHINE + '" start ' + data.VM, null, true));
                    }
                }).then(function() {
                    return (bash.run('"' + data.DOCKER_MACHINE + '" env --shell=bash ' + data.VM, null, true));
                }).then(function(res) {
                    if (res.err[0] && res.err[0].match('docker-machine regenerate-certs')) {
                        return (bash.run('"' + data.DOCKER_MACHINE + '" regenerate-certs -f ' + data.VM, null, true).then(function() {
                            return (bash.run('"' + data.DOCKER_MACHINE + '" env --shell=bash ' + data.VM, null, true));
                        }));
                    } else {
                        return (res);
                    }
                }).then(function(res) {
                    var _countStr = function(str, match) {
                        return (((str || '').match(new RegExp(match, 'g')) || []).length);
                    };

                    var _env = [], line = (res.out.join('\n')).split('\n');
                    for (var i in line) {
                        if (_countStr(_env[Math.max(_env.length - 1, 0)], '"') != 2) {
                            _env[Math.max(_env.length - 1, 0)] = (_env[Math.max(_env.length - 1, 0)] || '') + line[i];
                        } else {
                            _env.push(line[i]);
                        }
                    }

                    var env = {MSYS_NO_PATHCONV: 1};
                    for (var i in _env) {
                        if (_env[i].indexOf('export') != -1) {
                            var tmp = _env[i].split('="');
                            env[tmp[0].replace('export ', '')] = tmp[1].substr(0, tmp[1].length - 1);
                        }
                    }
                    var time = $.time.now().ms($.config.get('docker.env.time')).get;
                    console.log('init docker env', env, 'cache expires', (new Date(time)).toString());
                    $.file.write($.config.get('docker.env.path'), $.json.encode({
                        env: env,
                        time: time
                    })).then(function() {
                        self._staticEnv.envReady = true;
                        p.resolve((self._staticEnv.env = env));
                    }, function() {
                        self._staticEnv.envReady = true;
                        p.resolve((self._staticEnv.env = env));
                    });
                });
            } else {
                p.resolve(self._staticEnv.env);
            }

            return (p);
        }
    };

    module.exports = obj;
});
