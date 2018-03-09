"use strict";

$.require([
	'hyperion!/lib/docker/base.js',
	'hyperion!/lib/watcher.js',
    'hyperion!/build.js',
    'hyperion!/profile.js'
], function(
	base,
	watcher,
    build,
    profile
) {

	var obj = function() {
		this._config = $.config.get('docker.watcher');
	};
	obj.prototype = $.extends(base, {
        /**
         * Release a image build version by pushing it into a Docker Registry
         *
         * @returns {Promise.<TResult>|*|obj}
         */
        release: function(c) {
            var self = this, config = c || {};

            var name = (config.name || '');

            console.log('push', name, config);

            var b = build.get(name);
            if (b) {
                return (this.build(config, true).then(function() {
					console.log(self.registry.isLocal());
                    if (!self.registry.isLocal()) {
                        return (self.registry.push(name + ':' + config.version));
                    }
                    return ($.promise().reject(new Error('Can\'t release a image without a registry')));
                }));
            }

            return ($.promise().reject('build object is missing'));
        },

        /**
         * Fetch image from a Docker Registry
         *
         * @param c
         * @returns {Promise.<TResult>|*|obj}
         */
        fetch: function(c) {
            var self = this, config = c || {};

            var build = (config.name || self._buildConfig.name.toLowerCase());
            console.log('fetch', build);

            if (c.image) {
                return (self.registry.pull(c.image));
            }

            return (this._initShell().then(function() {
                return (self.images());
            }).then(function(images) {
                return (self.buildImages($.config.get('docker.build.auto'), images));
            }).then(function() {
                return ($.file.access(appRoot + '/docker/build/' + build + '.js'));
            }).then(function() {
                var info = $.require('docker!/build/' + build + '.js');

                if (!self._registry.isLocal()) {
                    return (self._registry.pull(self._buildConfig.login.toLowerCase() + '/' + info.image + ':' + info.version));
                }
                return ($.promise().reject(new Error('Can\'t fetch image without a Registry')));
            }, function(err) {
                return ($.promise().reject(err));
            }));
        },

        /**
         * Start watcher up
         *
         * @returns {obj}
         */
		watcher: function() {
			var self = this, map = null;

			return (this._initShell().then(function() {
                var p = {
                    map: 'resources!/hypeMap.json',
                    profile: self._config.profile
                };
                console.log(p);

                console.log('profile loading');
                return ($.file.stat(p.map).then(function () {
                    return ($.file.read(p.map).then(function(res) {
                        return ($.json.parse(res) || profile.get(p.profile))
                    }));
                }, function() {
                    return (profile.get(p.profile));
                }));
            }).then(function(res) {
                map = res;
                console.log('loaded hype map', map);

                /*if ($.config.get('docker.cleanup')) {
                    var use = [];
                    for (var i in map.container) {
                        use.push(map.container[i].image + ':' + map.container[i].version);
                    }
                    return (self.action('cleanup', {images: use}))
                } else {
                    return (true);
                }
            }).then(function() {*/
                return (self.images());
            }).then(function() {
                self._config.map = map;

                var watch = new watcher(self);
                console.log('init watcher with config', self._config);
                watch.set(self._config);

                var timeout = setTimeout(function() {
                    console.log('skip fetch map from remote');
                    watch.startUp();
                }, $.time.second(15).get);

                watch.data.init(self._config.key).then(function() {
                    clearTimeout(timeout);
                    console.log('update map from remote');
                    watch.startUp();
                });

                return (watch);
            }, function() {
                return ($.promise().reject(new Error('no profile found ' + self._config.profile)));
            }));
		}
	});

	module.exports = obj;
});
