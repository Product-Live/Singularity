"use strict";

/**
 * Extend prototype object
 *
 * @param source
 * @param fields
 * @returns {Inherit}
 */
module.exports = function(source, fields) {
	var parent = (($.is.string(source)) ? $.require(((source[0] == '!') ? 'base' : '') + source) : source);

	var Inherit = function() {};
	Inherit.prototype = parent.prototype;
	
	var obj = new Inherit();
	for (var name in fields) {
		obj[name] = fields[name];
	}
	
	if (fields.toString !== Object.prototype.toString) {
		obj.toString = fields.toString;
	}
	return (obj);
};