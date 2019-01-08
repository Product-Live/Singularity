"use strict";


var obj = function() {};
obj.prototype = {
	/**
	 * Json parse that will catch errors
	 * @param json
	 * @returns {*}
	 */
	parse: function(json) {
		var a = null;
		try {
			a = JSON.parse(json);
		} catch (err) {
			//console.log('json decode', str, err.stack);
		}
		return (a);
	},

    /**
     * Json encode and string will catching errors
     * @param str
	 * @param replacer
	 * @param space
     * @returns {*}
     */
	stringify: function(str, replacer, space) {
		var a = null;
		try {
			if ($.defined(replacer) || $.defined(space)) {
				a = JSON.stringify(str, replacer, space);
			} else {
				a = JSON.stringify(str);
			}
		} catch (err) {
			console.log('json encode error');
		}
		return (a);
	},

	encode: function(json, replacer, space) {
		return (this.stringify(json, replacer, space));
	},
	decode: function(str) {
		return (this.parse(str));
	}
};

module.exports = obj;