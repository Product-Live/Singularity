"use strict";

$.require([
	'lib!model/public.js'
], function(
	pub
) {
		
	var obj = function(type) {
		this.type = type;
		if (!$.is.type(type) && $.is.not(type, ['model', 'any'])) {
			throw new Error(this.type + ' is not a valid type');
		}
		this._config = {
			default: null,
			cast: null,
			model: null
		};
	};
	obj.prototype = {
        /**
         * Merge model (not idea add more later :D)
         *
         * @param data
         * @param source
         * @returns {*}
         * @private
         */
        _mergeModel: function(data, source) {
            if ($.is.instance(source, pub)) {
                data = source.set(($.is.instance(data, pub)) ? data.get() : data);
            } else {
                if (!$.is.instance(data, pub)) {
                    var c = this._config.model.create();
                    data = c.set(data);
                }
            }

            return (data);
        },

        /**
         * Cast the data give base on the map
         */
		_cast: (function() {
			var _cast = {
				int: function(self, d) {
					return ((d !== '' && d !== null)? Number(d) : null);
				},
				time: function(self, d) {
					return (($.defined(d) && d != '') ? (new Date(d)).getTime() : null);
				},
				string: function(self, d) {
                    var data = ($.is.object(d)) ? d.toString() : d;
                    if ($.is.instance(d, RegExp)) {
                        return (data.substring(1, data.length - 1));
                    }
                    return (data);
				},
				any: function(self, d) {
                    return (($.is.object(d)) ? d.toString() : d);
				}
				/*model: function(self, d) {
					if ($.defined(self._cogObj)) {
						var data = (new self._cogObj()).json(d, true);
						return (data);
					} else {
						return (d);
					}
				}*/
			};

			return (function(data, source) {
				if ($.defined(this._config.model)) {
					if (this.type === 'array' && $.is.array(data)) {
						for (var i in data) {
							data[i] = this._mergeModel(data[i], source[i]);
						}
					} else {
                        data = this._mergeModel(data, source);
					}
				}
				if ($.defined(_cast[this.type])) {
					data = (($.is.function(_cast[this.type])) ? _cast[this.type](this, data) : _cast[this.type]);
				}
				return (($.is.function(this._config.cast))? this._config.cast(data, source) : data);
			});
		})(),

        /**
         * Get default
         *
         * @returns {null}
         * @private
         */
		_default: function() {
			return (this._config.default);
		},

        /**
         * Cast function to run after internal casts
         *
         * @param func
         * @returns {obj}
         */
		cast: function(func) {
			if (!$.is.function(func) && func !== null) {
				throw new Error('expected func for cast callback');
			}
			this._config.cast = func;
			return (this);
		},

        /**
         * Set the default value for field
         *
         * @param arg
         * @returns {obj}
         */
		default: function(arg) {
			this._config.default = arg;
			return (this);
		},

        /**
         * Give a model to use on type
         *
         * @param m
         * @returns {obj}
         */
		model: function(m) {
			if ($.is.not(this.type, ['model', 'array'])) {
				throw new Error(this.type + ' is a wrong type can only be used on model type');
			}
			this._config.model = m;
			return (this);
		}
	};

	module.exports = obj;
});
