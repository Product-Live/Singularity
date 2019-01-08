"use strict";

$.require([
	'hyperion!/lib/watcher/data/model/container.js'
], function(
	container
) {

	module.exports = $.model(function(m) {
		m.name('hyperionConfig').init({
			id: m.type('string').default(null).cast(function() {
                return ($.config.get('env.session'));
            }),
			endPoint: m.type('string').default(null),
			name: m.type('string').default(null),
			active: m.type('bool').default(true),
			error: m.type('array').default([]),
			container: m.type('array').model(container.create()).default([])
		}).collection($.config.get('mongo.collection.hyperion'));
	});
});
