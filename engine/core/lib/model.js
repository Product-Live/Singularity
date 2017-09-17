"use strict";

$.require([
    'lib!model/static.js',
	'lib!model/core.js'
], function(
    staticObj,
	core
) {

	/**
	 * Create new model or get existing on with a path or get static methods
	 *
	 * @param arg
	 * @returns {*}
	 */
	module.exports = function(arg) {
		if (!$.defined(arg)) {
            return (staticObj);
		}

		if ($.is.function(arg)) {
			return (new core(arg));
		} else if ($.is.string(arg)) {
			var a = $.require(arg);
			if ($.scheme.instance(core, a)) {
				return (a.create());
			} else {
				throw new Error('path is not a instance of model object');
			}
		} else {
			throw new Error('expecting a string "require path" or function "build new model"');
		}
	};
});