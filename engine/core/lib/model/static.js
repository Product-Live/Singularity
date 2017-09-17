"use strict";

$.require([
	'lib!model/public.js'
], function(
	pub
) {

	/**
	 * Static utils to be used anywhere
	 * @type {{is: Function}}
	 */
	module.exports = {
        is: function(a) {
            return ($.is.instance(a, pub));
        }
	};
});