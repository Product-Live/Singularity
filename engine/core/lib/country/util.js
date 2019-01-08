"use strict";

/*
	look at https://openexchangerates.org/
	for a conversion api
*/

var obj = function() {};
obj.prototype = {
	_map: {
		fr: $.require('lib!country/lang/fr.js'),
		en: $.require('lib!country/lang/en.js')
	},

	getName: function(iso, lang) {
		return (this._map[(lang || 'fr')][iso.toUpperCase()]);
	},
	getCode: function(name, lang) {
		var l = (lang || 'fr');
		for (var i in this._map[l]) {
			if (this._map[l][i] == name) {
				return (i);
			}
		}

		return (i);
	}
};

module.exports = obj;