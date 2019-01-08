"use strict";

$.require([
	'lib!model/type.js'
], function(
	type
) {

	var obj = function(map, data) {
		this._map = map;
		this._data = data;
		this._valid = true;
		this._report = [];
		this._init(this._map._struct, this._data);
	};
	obj.prototype = {
        /**
         * Merge sub model validation report into ours
         *
         * @param data
         * @returns {*|boolean}
         * @private
         */
		_validTypeSub: function(data) {
			var v = data.valid(), r = v.report();
			for (var i in r) {
				this._report.push(r[i]);
			}
			return (v);
		},

        /**
         * Validate the type and run sub validation of model if it is
         *
         * @param map
         * @param data
         * @returns {*}
         * @private
         */
		_validType: function(map, data) {
			if ($.defined(map._config.model)) {
				if ($.is.array(data)) {
					var out = true;
					for (var i in data) {
						if (!this._validTypeSub(data[i])) {
							out = false;
						}
					}
					return (out);
				} else {
					return (this._validTypeSub(data));
				}
			}
			return ($.is.type(map.type) && $.is[map.type](data) || data === null);
		},

        /**
         * Run test on data to see if it has the correct type
         *
         * @param map
         * @param data
         * @private
         */
		_init: function(map, data) {
			for (var i in data) {
				if ($.defined(map[i]) && $.is.object(data[i]) && !$.is.array(data[i]) && !$.is.instance(map[i], type)) {
					this._init(map[i], data[i]);
				} else {
					var v = this._validType(map[i], data[i]);
					if (!v) {
						this._valid = false;
					}
					
					this._report.push({
						report_type: (!v)? 'error': 'info',
						key: i,
						exist_on_map: $.defined(map[i]),
						type_data: ($.is.instance(map[i], type))? map[i] : 'not a type',
						type: map[i].type,
						value: data[i],
						model_name: this._map._name,
						type_of_value: typeof(data[i])
					});
				}
			}
		},

        /**
         * Is the test valid
         * @returns {boolean|*}
         */
		is: function() {
			return (this._valid);
		},

        /**
         * Get report generated from validation test
         *
         * @returns {Array|*}
         */
		report: function() {
			return (this._report);
		},

        /**
         * Get Array of just the error from report
         *
         * @returns {Array}
         */
		error: function() {
			var out = [];
			for (var i in this._report) {
				if (this._report[i].report_type === 'error') {
					out.push(this._report[i]);
				}
			}
			return (out);
		}
	};

	module.exports = obj;
});