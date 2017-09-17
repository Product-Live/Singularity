"use strict";

var _step = function(data, type, obj, i) {
	obj.out[i] = data;
	obj.done += 1;
	obj[type] += 1;
	if (obj.done >= obj.max) {
		if (obj.reject === 0) {
			obj.p.resolve(obj.out);
		} else {
			obj.p.reject(obj.out);
		}
	}
}, _block = function(array, i, handle) {
	array[i].then(function(data) {
		_step(data, 'resolve', handle, i);
	}, function(err) {
		_step(err, 'reject', handle, i);
	});
};

/**
 * Resolve once all promise give in the array are complete
 * @param array
 * @returns {*}
 */
module.exports = function(array) {
	var handle = {
		p: new $.promise(),
		done: 0,
		reject: 0,
		resolve: 0,
		out: [],
		max: array.length
	};

	if (array.length <= 0) {
		handle.p.resolve();
		return (handle.p);
	}

	for (var i in array) {
		if (array[i] instanceof $.promise || array[i] instanceof Promise) {
			_block(array, i , handle);
		} else {
			_step(array[i], 'resolve', handle, i);
		}
	}

	return (handle.p);
};