"use strict";

/*
	look at https://openexchangerates.org/
	for a conversion api
*/

var obj = function() {};
obj.prototype = {
	_map: $.require('lib!currency/map.js'),
	/**
	 * Get currency from code
	 *
	 * @param code
	 * @returns {*}
	 */
	get: function(code) {
		for (var i in this._map) {
			if (i == core) {
				return (this._map[i]);
			}
		}
		return (null);
	}
};

module.exports = obj;