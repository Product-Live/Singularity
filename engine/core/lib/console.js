"use strict";

$.require([
	'lib!console/core.js',
	'lib!console/color/core.js'
], function(
	console,
	color
) {

    /**
     * Build all loggers from config
     */
	var list = $.config.get('console.logger'), logOut = {}, addLog = function(name) {
		var c = new console(name), f = function() {
            c.print(arguments);
			return (f);
		};
        return (f);
	};
	for (var i in list) {
		logOut[i] = addLog(i);
	}

    /**
     * Build all color function
     * @type {string[]}
     */
	var colorRef = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'none'], colorOut = {}, addColor = function(col) {
		return (function() {
			var c = new color();
			return (c._add(col, arguments));
		});
	};
	for (var i in colorRef) {
        colorOut[colorRef[i]] = addColor(colorRef[i]);
    }

	module.exports = {
		log: logOut,
		color: colorOut
	};
});