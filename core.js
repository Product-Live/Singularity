"use strict";

process.stdout.write('\x1b[' + (90 + 7) + 'm');

var util = {
    has: function(reg) {
        for (var i in process.argv) {
            if (process.argv[i].match(reg)) {
                return (true);
            }
        }
        return (false);
    },
    
    commandLine: function() {
        var libLoader = require(appRoot.engine + '/engine/core/global.js');
        libLoader.preConfig();

        var _c = {keychain: {}};
        if (util.has(/^--watcher/i)) {
            _c.appProfile = 'hyperion';
        }
        if (util.has(/^--nodep/i) || process.env.promise == 'nodep') {
            _c.promise = 'nodep'; // deprecated (this was used when more then one promise existed)
        }
        libLoader.base(_c);

        var c = new ($.require('core!cmd.js'))(process.argv).setMap({
            help: ['h', 'H'],
            port: 'p',
            key: 'k',
            force: 'f',
            queue: 'q',
            name: 'n',
            salt: 's',
            logPath: 'l'
        }).parse();

        return (c);
    }
};

module.exports = function(bootstrap) {
    Error.stackTraceLimit = Infinity;
    global.appRoot = {
        absolute: bootstrap.absoluteRoot,
        engine: (require('path').resolve(__dirname)).replace(/\\/g, '/'),
        project: bootstrap.projectRoot
    };

    var stdout = new (require(appRoot.engine + '/engine/core/stdout.js'))();
    if (util.has(/^--PERFORMANCE_DUMP/i)) {
        global.__APP_PERFORMANCE_DUMP = '8aze7'; // magic Number
    }

    var c = util.commandLine();

    var v = new $.version(process.version);
    if (!v.great($.config.get('env.node.version'))) {
        throw new Error('NodeJs: needs ' + $.config.get('env.node.version') + ' or greater to run please update your NodeJs version.');
    }

    return ($.require('engine!setup.js')().then(function(setupConfig) {
        var upStart = $.require('core!upStart.js');
        var devWatcher = $.require('core!watcher.js');

        var p = new $.promise();

        // rebuild config
        var env = {debugMode: false};
        for (var i in process.env) {
            var t = $.json.parse(process.env[i]);
            env[i] = ($.defined(t)) ? t : process.env[i];
        }

        c.if('stdout', function() {
            stdout.log({
                path: (env.stdoutLogger = (c.get('stdout') || '.std'))
            });
        });

        c.if('debug', function () {
            env.debugMode = true;
        });

        var keychain = c.get('keychain') || env.chainPassword || '54IOKL2TJ29IUJ';
        var conf = $.schema.merge($.schema.merge(setupConfig, {
            keychain: require(appRoot.engine + '/engine/core/lib/keychain.js')({
                password: keychain,
                path: appRoot.project + '/config/'
            }).load(),
            env: c.get('env') || env.env,
            keychainPassword: keychain,
            port: c.get('port'),
            name: c.get('name'),
            session: setupConfig.session || c.get('session'),
            cleanup: c.get('cleanup'),
            debug: env.debugMode,

            moduleProfile: c.get('module') || null,
            appProfile: c.get('profile') || c.get('watcher') || 'worker',
            dockerProfile: c.get('map'),

            buildImage: $.defined(c.get('build')),

            customQueue: c.get('queue'),

            LOG_PATH: c.get('logPath') || setupConfig.LOG_PATH
        }), env);

        c.if('unwrap', function () {
            conf.upstartWrap = false;
        });

        if ($.is.function(bootstrap.command)) {
            if (bootstrap.command(c, conf)) {
                return;
            }
        }

        c.if('local', function () {
            conf.isLocal = true; // setup local version of app
            $.config.reload(conf);
        }).else(function () {
            $.config.reload(conf);
        });

        // main options
        c.if('help', function () { // HALP!!
            console.log('' +
                'Usage: node main.js [OPTIONS]\n\n' +
                'Options:\n\n' +
                '\t-h, -H, --help\t\tPrint usage\n' +
                '\t--bash\t\t\tStart bash with docker env setup\n' +
                '\t--build [arg]\t\tBuild project default is name in package.json\n' +
                '\t--release [arg]\t\tBuild image and push to registry\n' +
                '\t--fetch [arg]\t\tPull image that has been released on the registry\n' +
                '\t--image [arg]\t\tForce image change for build and release\n' +
                '\t--purge [arg,arg,etc]\tRemove all or selected temp file(s) on the application\n' +
                '\t--local\t\t\tRun completely isolated for remote servers\n' +
                '\t--watcher [arg]\t\tStart containers synced with machine session arg will set profile\n' +
                '\t--queue, -q [arg]\t\tForce to use of a queue.\n' +
                '\t--profile [arg]\t\tForce profile use\n' +
                '\t--password [arg]\t\tgen a random password\n' +
                '\t--daemon [arg]\t\tTODO\n' +
                '\t--docker [arg]\t\tRun shortcut actions.\n' +
                '\t--loadhub\t\tSet the hub to load if booted in watcher mode.\n' +
                '\t--map [arg]\t\tSet the profile to use as default map.\n' + // docker/hyperion/lib/watcher/profile/{{NAME}}.js
                '\t--autoload\t\t\tReload the application if files are changed.\n' +
                '\t--clearqueue\t\tClear all task on a given topic default value is the current profile topic list.\n' +
                '\t--deploy\t\tTODO\n' +
                '\t-f, --force\t\tTODO\n' +
                '\t--session\t\tOverwrite the machine session\n' +
                '\t--env\t\t\tSet the env for the project default: dev\n' +
                '\t-l\t\t\tSet the application log path: default /app/resources/logs\n' +
                '\t-k, --key\t\tset key\n' +
                '\n\nNote:' +
                '\t"/dev/.initramfs/v2.log" is the log location for upstart.\n' +
                '');
            p.reject();
        }).elseIf('deploy', function () { // deploy all dependencies onto the system
            var deploy = new ($.require('core!deploy.js'))(c.get('deploy') || 'unix');

            deploy.run().then(function () {
                p.reject();
            }, function (err) {
                p.reject(err);
            });
        }).elseIf('skeleton', function () { // deploy all dependencies onto the system
            var a = new ($.require('core!skeleton.js'))({
                type: c.get('skeleton') || 'app',
                name: c.get('name') || 'basic'
            });

            a.create().then(function () {
                p.reject();
            }, function (err) {
                p.reject(err);
            });
        }).elseIf('chain', function() {
            var type = c.get('chain') || 'build', _t = {
                build: function(obj) {
                    obj.build();
                    p.reject();
                },
                extract: function(obj) {
                    obj.extract();
                    p.reject();
                },
                view: function(obj) {
                    console.log(obj.load());
                    p.reject();
                }
            };
            if (_t[type]) {
                _t[type](require(appRoot.engine + '/engine/core/lib/keychain.js')({
                    password: c.get('password') || 'api/54IOKL2TJ29IUJ',
                    path: appRoot.project + (c.get('path')? c.get('path') : '/config/')
                }));
            } else {
                console.warn('chain actions are view, build and extract');
                p.reject();
            }
        }).elseIf('closure', function () { // deploy all dependencies onto the system
            var closure = new ($.require('core!closure.js'))(c.get('closure') || 'hub');

            closure.build().then(function () {
                p.reject();
            }, function (err) {
                p.reject(err);
            });
        }).elseIf('daemon', function () { // control the daemon on the linux (restart, start, stop, status)
            //https://www.digitalocean.com/community/tutorials/the-upstart-event-system-what-it-is-and-how-to-use-it
            p.reject(); // TODO: daemon controller needed for linux system
        }).elseIf('htaccess', function () {
            if ((c.get('user') || c.get('u')) && (c.get('password') || c.get('p'))) {
                var bcrypt = $.require('npm!bcryptjs');
                var salt = bcrypt.genSaltSync(Number(c.get('salt')) || 10);
                var hash = bcrypt.hashSync(c.get('password') || c.get('p'), salt);
                console.log((c.get('user') || c.get('u')) + ':' + hash);
            }
            p.reject();
        }).elseIf('mkpasswd', function () { // build the app
            if (c.get('mkpasswd')) {
                var sha512crypt = $.require('npm!sha512crypt-node/sha512crypt');
                console.log(sha512crypt.b64_sha512crypt(c.get('mkpasswd'), c.get('salt') || $.key.random()));
            }
            p.reject();
        }).elseIf('password', function () { // build the app
            console.log($.key.random({
                length: Number(c.get('password'))
            }));
            p.reject();
        }).else(function () {
            p.resolve();
        });

        return (p.then(function () {
            var path = $.config.get('env.bootstrap') + $.config.get('env.profile') + '.js';
            if ($.config.get('env.upstart')) {
                (new upStart()).run(function () { // keep alive
                    c.if('autoload', function () {
                        new devWatcher([
                            'app!/engine/base',
                            'app!/engine/bootstrap',
                            'app!/engine/core',
                            'app!/module/',
                            'app!/config/',
                            'app!/config.js'
                        ]);
                    });
                    $.require(path);
                });
            } else {
                $.require(path);
            }
            return (path);
        }, function (err) {
            return ($.promise().reject(err));
        }));
    }));
};
