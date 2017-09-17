"use strict";

$.require([
	'hyperion!/lib/docker/format.js'
], function(
	_
) {

	module.exports = $.model(function(m) {
		m.init({
			src: m.type('string').default('').cast(function(data) {
				return (_.sigPath(data));
			}),
			dest: m.type('string').default('').cast(function(data) {
				return (_.sigPath(data));
			})
		}).collection($.config.get('mongo.collection.hyperion'));
	});
});
