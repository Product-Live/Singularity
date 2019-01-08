"use strict";

$.require([
	//
], function(
	//
) {
    
	var obj = function() {};
	obj.prototype = $.extends('!base', {
		arrayPath: function(path) {
			var a = $.path(path), b = a.replace(appRoot.engine + '/', '').replace(appRoot.project + '/', '');
			var out = b.split('/');
			if (a !== b) {
				out[0] = ((a.match(appRoot.engine))? appRoot.engine : appRoot.project) + '/' + out[0];
			}
			return (out);
		}
	});

	module.exports = new obj();
});