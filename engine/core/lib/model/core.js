"use strict";

$.require([
	'lib!model/type.js',
	'lib!model/map.js',
	'lib!model/valid.js',
	'lib!model/public.js'
], function(
	type,
	map,
	valid,
	pub
) {

	var obj = function(func) {
		if ($.is.function(func)) {
			this._func = func;
			this.map = new map(this);
			
			var tmp = this._func(this.map);
			if ($.is.instance(tmp, map)) {
				this.map = tmp;
			}
		} else {
			throw new Error('expecting a function to build model object');
		}
	};
	obj.prototype = {
		/**
		 * Merge data into the map format
		 *
		 * @param source
		 * @param data
		 * @param m
		 * @returns {*}
		 * @private
		 */
		_merge: function(source, data, m) {
			if ($.defined(data)) {

				var map = m || this.map._struct;
				for (var i in map) {
					if ($.is.instance(map[i], type)) {
						source[i] = ($.defined(data[i]))? map[i]._cast(data[i], source[i]) : (($.defined(source[i]))? source[i] : map[i]._cast(map[i]._default(), source[i]));
					} else {
						if ($.defined(data[i])) {
							source[i] = this._merge(source[i], data[i] || {}, map[i]);
						}
					}
				}
			}
			return (source);
		},

		/**
		 * make a copy the Struct
		 * @param s
		 * @returns {{}}
		 * @private
		 */
		_copy: function(s) {
			var out = {}, struct = ($.defined(s))? s : this.map._struct;
			for (var i in struct) {
				if ($.is.object(struct[i])) {
					out[i] = ($.is.instance(struct[i], type))? struct[i]._cast(struct[i]._default()) : this._copy(struct[i]);
				}
			}
			return (out);
		},

		/**
		 * Get value out of model into struct format
		 *
		 * @param data
		 * @param options
		 * @param d
		 * @returns {*}
		 * @private
		 */
		_get: function(data, options, d) {
			var out = ($.is.array(data))? [] : {}, dep = d || 0;
			for (var i in data) {
				if ($.is.object(data[i])) {
					out[i] = ($.is.instance(data[i], pub))? data[i].get() : this._get(data[i], options, dep + 1);
				} else {
                    if ((dep == 0 && options.mongoId == true && i == '_id') || i != '_id') {
                        out[i] = data[i];
                    }
				}
			}
			if (dep == 0 && options.name == true) {
				out.struct = this.map._name;
			}
			return (out);
		},

        /**
         * Create a new public interface
         *
         * @returns {*}
         */
		create: function() {
			return (new pub(this, valid));
		},


        /**
         * Create
         *
         * @param data
         * @returns {Array}
         */
		run: function(data) {
            var d = ($.is.array(data)) ? data : [data], out = [];
            for (var i in d) {
                var p = new pub(this, valid);
                out.push(p.set(d[i]).get());
            }

			return ((out.length == 1) ? out[0] : out);
		}
	};

	module.exports = obj;
});