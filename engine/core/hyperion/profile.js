"use strict";

$.require([
    'hyperion!/lib/watcher/data/model/config.js',
    'hyperion!/lib/watcher/data/model/container.js'
], function(
    config,
    container
) {

	var obj = function() {
        this._list = {};
        this._key = {};
    };
	obj.prototype = {
        add: function(key, data) {
            for (var i in data.container) {
                data.container[i] = container.create().set(data.container[i]).get();
            }
            this._list[key] = config.create().set(data).get();
        },

        get: function(key) {
            return (this._list[key]);
        }
	};

	module.exports = new obj();
});