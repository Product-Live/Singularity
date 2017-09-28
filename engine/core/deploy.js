"use strict";

$.require([
    'core!bash'
], function(
    bash
) {

    var systemd = [
        '[Unit]',
        'Description=My Advanced Service',
        'After=etcd.service',
        'After=docker.service',
        '',
        '[Service]',
        'TimeoutStartSec=0',
        'ExecStart=/usr/bin/node ' + appRoot.absolute + '/main.js --watcher --keychain ' + $.config.get('keychain') + ' --port 580 --stdout --docker hub',
        '',
        '[Install]',
        'WantedBy=multi-user.target'
    ];

    var obj = function(type) {};
    obj.prototype = $.extends('!base', {
        bash: function(cmd) {
            return (bash.raw(cmd, {cwd: $.path('root!')}, true).then(function(res) {
                return ((res.err || []).join(' ') +  ' ' + (res.out || []).join(' ')).trim();
            }, function(err) {
                return (err);
            }));
        },

        version: function() {
            return (this.bash('lsb_release -a').then(function(res) {
                var r = res.split('\n'), out = {};
                for (var i in r) {
                    var tmp = r[i].split(':\t');
                    if (tmp.length == 2) {
                        out[tmp[0].trim()] = tmp[1].trim();
                    }
                }
                return (out);
            }));
        },

        run: function() {
            var self = this, p = new $.promise(), version = {}, config = $.config.get('deploy') || {service: 'v2'};

            var service = (config.service && config.service.match(/^[a-zA-Z0-9]+$/))? config.service : 'v2';
            self.version().then(function(res) {
                version = res;
                if (res['Distributor ID'] != 'Ubuntu') {
                    p.resolve();
                } else{
                    return (self.bash('apt-get update'))
                }
            }).then(function() {
                if (config.user && config.user.match(/^[a-zA-Z0-9]+$/)) {
                    return (self.bash('chsh -s /bin/bash ' + config.user, null, true));
                }
                return (true);
            }).then(function() {
                return (self.bash('apt-get install -y apt-transport-https ca-certificates ntp', null, true));
            }).then(function() {
                return (self.bash('apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D', null, true));
            }).then(function() {
                var l = {
                    '12.04 (LTS)': 'deb https://apt.dockerproject.org/repo ubuntu-precise main',
                    '14.04 (LTS)': 'deb https://apt.dockerproject.org/repo ubuntu-trusty main',
                    '15.04 (LTS)': 'deb https://apt.dockerproject.org/repo ubuntu-vivid main',
                    '16.04 (LTS)': 'deb https://apt.dockerproject.org/repo ubuntu-xenial main'
                };

                var deb = l[version.Release + ' (LTS)'];
                if (!deb) {
                    var ver = version.Release.split('.')[0];
                    for (var i in l) {
                        if (i.match(new RegExp(ver + '\\.\\d*\\s\\(LTS\\)'))) {
                            deb = l[i];
                            break;
                        }
                    }
                }

                return ($.file.write('/etc/apt/sources.list.d/docker.list', deb || l['16.04 (LTS)']));
            }).then(function() {
                return (self.bash('apt-get update'));
            }).then(function() {
                return (self.bash('apt-get purge -y lxc-docker'));
            }).then(function() {
                return (self.bash('apt-cache policy docker-engine'));
            }).then(function() {
                return (self.bash('apt-get update'));
            }).then(function() {
                return (self.bash('apt-get install -y docker-engine'));
            }).then(function() {
                return (self.bash('groupadd docker'));
            }).then(function() {
                if (config.user && config.user.match(/^[a-zA-Z0-9]+$/)) {
                    return (self.bash('usermod -aG docker ' + config.user));
                }
                return (true);
            }).then(function() {
                return (self.bash('service docker start'));
            }).then(function() {
                return ($.file.write('/etc/systemd/system/' + service + '.service', systemd.join('\n')));
            }).then(function() {
                return (self.bash('sudo systemctl enable /etc/systemd/system/' + service + '.service'));
            }).then(function() {
                return (self.bash('systemctl start ' + service + '.service'));
            }).then(function() {
                return $.all([ // these will have root as owner because of this
                    $.file.remove('engine!/node_modules/'),
                    $.file.remove('engine!/package-lock.json')
                ]);
            }).then(function () {

                p.resolve()
            });

            return (p);
        }
    });

    module.exports = obj;
});