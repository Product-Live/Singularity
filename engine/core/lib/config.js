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
						'project': appRoot.project,
						'root': appRoot.engine,
						'engine': appRoot.engine + '/engine',
						'base': appRoot.engine + '/engine/base',
						'npm': appRoot.engine + '/engine/node_modules',
						'node': '',
						'core': appRoot.engine + '/engine/core',
						'lib': appRoot.engine + '/engine/core/lib',
						'hyperion': appRoot.engine + '/engine/core/docker/hyperion',
						'resources': appRoot.project + '/resources'
					}
				}
			};
			console.warn('error loading config using fallback');
		}
		return (this);
	}
};

module.exports = obj;