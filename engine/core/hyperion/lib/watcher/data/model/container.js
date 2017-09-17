"use strict";

$.require([
	'hyperion!/lib/watcher/data/model/volume.js',
	'hyperion!/lib/docker/format.js'
], function(
	volume,
	_
) {

	module.exports = $.model(function(m) {
		m.name('hyperionContainer').init({
			key: m.type('string').default('').cast(function(data) {
				return (_.alpha((data == '')? $.key.number() : data));
			}),
			active: m.type('bool').default(true),
			image: m.type('string').default('').cast(function(data) {
				return (_.version(data));
			}),
			version: m.type('string').default('latest').cast(function(data) {
				return (_.version(data));
			}),
			endPoint: m.type('string').default('').cast(function(data) {
				return (_.version(data));
			}),

			env: m.type('object').default({}).cast(function(data) {
				var out = {};
				for (var i in data) {
					out[_.escape(i)] = ($.is.object(data[i]))? data[i] : _.escape(data[i]);
				}
				return (out);
			}),
			volume: m.type('array').model(volume.create()).default([]),
			port: m.type('object').default({}).cast(function(data) {
				var out = {};
				for (var i in data) {
					out[(parseInt(i) || 0)] = (parseInt(data[i]) || 0);
				}
				return (data);
			}),
			link: m.type('array').default([]).cast(function(data) {
				for (var i in data) {
					data[i] = _.alpha(data[i]);
				}
				return (data);
			}),
			meta: {
				network: m.type('string').default('').cast(function(data) {
					return (_.alpha(data));
				}),
				extra: m.type('string').default(''),
				namespace: m.type('string').default('global')
			}

			//status: m.type('string').default(''),
			//startTime: m.type('int').default(0),
			//lastPing: m.type('int').default(0),
			//inspect: m.type('object').default(null),
			//lastInspect: m.type('int').default(0),
			//ping: m.type('int').default(0),

			//unitaryTest: m.type('string').default(null), // better the move this onto a sub object :)
			//unitaryConfig: m.type('object').default(null)
		}).collection($.config.get('mongo.collection.hyperion'));
	});
});
