"use strict";

var fs = require('fs');

var obj = function(config) {
    this._cachePath = {};
	this.reload(config);
};
obj.prototype = {
	/**
	 * Get config from cache or application setup
	 *
	 * @param path
	 * @returns {*}
	 */
	get: function(path) {
		if (!$.defined(path) || path == '') {
			return (this._config);
		}

        var key = ($.defined(this._cachePath[path])) ? this._cachePath[path] : (this._cachePath[path] = path.split('.'));
		var tmp = this._config;
		for (var i in key) {
			if (!$.defined(tmp[key[i]])) {
				return (null);
			}
			tmp = tmp[key[i]];
		}
		return (tmp);
	},

	/**
	 * Reload application config with new building config
	 *
	 * @param config
	 * @returns {obj}
	 */
	reload: function(config) {
        if (!$.is.object(config) || $.is.array(config)) {
            throw new Error('config seed needs to be a object.');
        }

		try {
			this._config = require(appRoot.project + '/config.js')(config || {});
			this._cachePath = {};
		} catch(err) {
			this._config = {
				require: {
					path: {
						'node': '',
						'root': appRoot.engine,
						'project': appRoot.project,
						'config': appRoot.project + '/config.js',
						'engine': appRoot.engine + '/engine',
						'base': appRoot.engine + '/engine/base',
						'npm': appRoot.engine + '/engine/node_modules',
						'core': appRoot.engine + '/engine/core',
						'lib': appRoot.engine + '/engine/core/lib',
						'public': appRoot.project + '/public',
						'hyperion': appRoot.engine + '/engine/core/hyperion',
						'hypeConfig': appRoot.project + '/resources/cache/hyperion/config',
						'bootstrap': appRoot.project + '/bootstrap',
						'app': appRoot.project + '',
						'resources': appRoot.project + '/resources',
						'keys': appRoot.project + '/resources/keys',
						'assets': appRoot.project + '/resources/assets',
						'cache': appRoot.project + '/resources/cache'
					}
				}
			};
			fs.stat(appRoot.project + '/config.js', function(e) {
				if (!e) {
					console.warn('failed to load config file in "' + appRoot.project + '/config.js"');
					console.warn(err);
				}
			});
		}

		return (this);
	}
};

module.exports = obj;
