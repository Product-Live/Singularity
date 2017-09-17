"use strict";

$.require([
	//
], function(
	//
) {

	var light = 90, dark = 30; // console color type

	var obj = function(color) {
		this.code = this._ref[color] || this._ref.white;
	};
	obj.prototype = $.extends('!base', {
        /**
         * Color code used to display in console
         */
		_ref: {
			black: '\x1b[' + (light + 0) + 'm',
			red: '\x1b[' + (light + 1) + 'm',
			green: '\x1b[' + (light + 2) + 'm',
			yellow: '\x1b[' + (light + 3) + 'm',
			blue: '\x1b[' + (light + 4) + 'm',
			magenta: '\x1b[' + (light + 5) + 'm',
			cyan: '\x1b[' + (light + 6) + 'm',
			white: '\x1b[' + (light + 7) + 'm',
			none: '\x1b[' + (light + 8) + 'm'
		}
	});

	module.exports = obj;
});
