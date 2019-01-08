"use strict";

$.require([
	'lib!model/type.js'
], function(
	type
) {

	var obj = function(core) {
		this._core = core;
		this._struct = {};
		this._id = {
			name: 'default',
			config: {}
		};
		this._name = null;
		this._collection = $.config.get('env.collection');
	};
	obj.prototype = {
		/**
		 * Create a new type to use in map
		 *
		 * @param t
		 * @returns {*}
		 */
		type: function(t) {
			return (new type(t));
		},

		/**
		 * Init the base Struct from a object give at start
		 *
		 * @param obj
		 * @returns {obj}
		 */
		init: function(obj) {
			if (!$.is.object(obj)) {
				throw new Error('init expected a object to create struct from')
			}
			this._struct = obj;

			this._struct._id = this.type('any'); // keep mongo keys

			return (this);
		},

		/**
		 * Set Collection to use
		 *
		 * @param name
		 * @returns {obj}
		 */
		collection: function(name) {
			this._collection = name;
			return (this);
		},

		/**
		 * Create Id system to use (check this don't remmeber)
		 * @param system
		 * @param config
		 * @returns {obj}
		 */
		id: function(system, config) {
			this._id = {
				name: system,
				config: config || {}
			};
			return (this);
		},

        /**
         * Set the name for the model
         */
		name: (function() {
			var _list = {};
		
			return (function(name) {
				if (this._name != name) {
					if ($.defined(_list[name])) {
						_list[name] += 1;
						console.log('model:', 'models with same name found count:', _list[name], 'on name', name);
					} else {
						_list[name] = 0;
					}
					this._name = name;
				}
				return (this);
			});
		})()
	};

	module.exports = obj;
});