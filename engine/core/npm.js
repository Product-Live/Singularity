'use strict';

$.require([
    'core!bash'
], function(
    bash
) {

    var obj = function(extra) {
        this._package = $.schema.copy(this._base);
        this._package.dependencies = $.schema.merge(this._package.dependencies, $.config.get('package.dependencies'));
        this.add($.config.get('package.dependencies')).add(extra);
    };
    obj.prototype = {
        _base: {
            name: 'Singularity',
            version: '1.0.0',
            description: 'Framework oriented service based projects.',
            author: 'anzerr',
            dependencies: {
                'bcryptjs': '^2.3.0',
                'mongodb': '^2.2.24',
                'sha512crypt-node': '^0.1.0',
                'ws': '^3.2.0',
                'request': '^2.74.0',
                'semver': '5.5.0'
            }
        },

        npm: function(cmd) {
            return (bash.raw(cmd, {cwd: $.path('engine!/')}, true).then(function(res) {
                return ((res.out[0] || '').replace('\n', '').trim());
            }, function(err) {
                return (err);
            }));
        },

        add: function(npm) {
            this._package.dependencies = $.schema.merge(this._package.dependencies, npm);
            return (this);
        },

        validVersion: function(version, ask) {
            try {
                const semver = require('semver');
                if (semver.valid(ask)) {
                    return !semver.satisfies(version, ask);
                }
                return false;
            } catch(e) {
                // fallback
            }
            var v = new $.version(version);
             if (ask.match(/^\>/)) {
                return v.great(ask);
            }
            if (ask.match(/^\>=/)) {
                return v.great(ask) && v.equal(ask);
            }
            if (ask.match(/^\</)) {
               return v.less(ask);
            }
            if (ask.match(/^\<=/)) {
                return v.less(ask) && v.equal(ask);
            }
            return false;
        },

        install: function() {
            var wait = [], report = {}, install = false, self = this, skip = $.config.get('module.purgeNPM');

            if (!skip) {
                for (let i in this._package.dependencies) {
                    ((i) => {
                        if (i === '') {
                            return;
                        }
                        wait.push($.file.read('npm!' + i + '/package.json').then((res) => {
                            let ver = ($.json.parse(res) || {}).version;
                            report[i] = {
                                missing: false,
                                version: ver,
                                needed: self._package.dependencies[i]
                            };
                            if (!install) {
                                install = this.validVersion(ver, self._package.dependencies[i]);
                            }
                            return (true);
                        }, () => {
                            report[i] = {missing: true};
                            install = true;
                            return (true);
                        }));
                    })(i)
                }
            }

            return ($.all(wait).then(() => {
                if (install || skip) {
                    console.log('install', report);
                    return $.all([
                        $.file.remove('engine!/node_modules/'),
                        $.file.remove('engine!/package-lock.json')
                    ]).then(() => {
                        return (self.npm('npm install'));
                    }).then((res) => {
                        return ({
                            report: report,
                            npm: res
                        });
                    });
                }
                return (report);
            }));
        },

        update: function() {
            var self = this;
            return ($.file.write('engine!/package.json', JSON.stringify(this._package, null, '\t')).then(function() {
                return (self.install());
            }));
        }
    };

    module.exports = obj;
});
