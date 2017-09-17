"use strict";

$.require([
    'lib!console/logger/master.js'
], function(
    master
) {

	var obj = function(name) {
		this._name = name;
	};
	obj.prototype = $.extends('!base', {
        _master: new master(),

        /**
         * Add new lock into stored
         *
         * @param array
         * @returns {*}
         */
        log: function(array) {
            return (this._master.log(array, this._name));
        },

        /**
         * Shutdown logger and save logs in stored
         * @returns {*|Promise|void}
         */
        close: function() {
            return (this._master.close());
        }
	});

	module.exports = obj;
});
