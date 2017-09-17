"use strict";

$.require([
	'lib!/console/logger/save/base',
    'core!/database/mongo'
], function(
	base,
    mongo
) {

	var obj = function(config) {
		this._config = config || {};
	};
	obj.prototype = $.extends(base, {
		save: function(data) {
            var self = this;
            return ((new mongo()).connect(this._config.connect).then(function(db) {
                return (db.collection(self._config.collection).insert(data));
            }).then(function() {
                return (true);
            }, function() {
                return (true);
            }));
		},
		close: function() {
			return ($.promise().resolve());
		}
	});

	module.exports = obj;
});