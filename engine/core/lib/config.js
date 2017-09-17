"use strict";

var obj = function(config) {
	this.reload(config);
};
obj.prototype = {
    _cachePath: {}, // hash map to reduce look up

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
		try {
			this._config = require(appRoot.project + '/config.js')(config || {});
			this._cachePath = {};
		} catch(e) {
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
			console.warn('error loading config using fallback');
		}
		return (this);
	}
};

module.exports = obj;