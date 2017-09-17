"use strict";

var self = {
	origin: require,
	debugHook: global.__APP_PERFORMANCE_DUMP,
	hook: new (require(appRoot.engine + '/engine/core/lib/hook.js'))(),
	get: function(p) {
		return ($.path(p));
	}
};


var obj = function() {};
obj.prototype = {
	get: function(path) {
		return (self.get(path));
	}
};

/**
 * Require wrapper to manage "!" and cleanup path because using
 *
 * @param path
 * @param callback
 * @returns {*}
 */
module.exports = function(path, callback) {
	if ($.defined(path)) {
		var list = ((!$.is.array(path)) ? [path] : path), out = [];

		for (var i in list) {
			var tmp = self.get(list[i]);
			if (self.debugHook) {
				out[i] = self.hook.wrap(tmp, self.origin(tmp));
			} else {
				out[i] = self.origin(tmp);
			}
		}
		if ($.is.function(callback)) {
			return (callback.apply(callback, out));
		}
		return ((out.length == 1)? out[0] : out);
	}
	
	return (new obj());
};