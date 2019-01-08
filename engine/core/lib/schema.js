"use strict";


var obj = function() {};
obj.prototype = {
    /**
     * Deep merge object B into A
     *
     * @param a
     * @param b
     * @returns {*}
     */
    deepMerge: function(a, b) {
        if ($.defined(b)) {
            for (var i in b) {
                if ($.is.object(a[i]) && $.is.object(b[i])) {
                    a[i] = this.deepMerge(a[i], b[i]);
                } else {
                    a[i] = b[i];
                }
            }
        }
        return (a);
    },

	arrayMerge: function(a, b) {
		if ($.defined(b)) {
			if (($.is.object(a) || $.is.array(a)) && ($.is.object(b) || $.is.array(b))) {
				if ($.is.array(a) && $.is.array(b)) {
					for (var x in b) {
						a.push(b[x]);
					}
				} else {
					for (var i in b) {
						a[i] = this.arrayMerge(a[i], b[i]);
					}
				}
			} else {
				a = b;
			}
		}
		return (a);
	},

	/**
	 * Shallow merge object B into A
	 *
	 * @param a
	 * @param b
	 * @returns {*}
	 */
	merge: function(a, b) {
        if (!$.defined(a) && !$.defined(b)) {
            var self = this;
            return ({
				deep: function(a, b) {
					return (self.deepMerge(a, b));
				},
				array: function(a, b) {
					return (self.arrayMerge(a, b));
				}
			})
        }

		if ($.defined(b)) {
			for (var i in b) {
				a[i] = b[i];
			}
		}
		return (a);
	},

	/**
	 * Copy object or array
	 * @deprecated use method clone(), it's more optimized
	 */
	copy: (function() {
		var copy = function(data) {
			this._hash = [];
			this._deep = false;
			this._data = data;
			this.copy = (($.is.object(data) || $.is.array(data)) && data !== null) ? this._format(data, 0) : data;
		};
		copy.prototype = {
			_format: function(obj, sub) {
				var out = (($.is.array(obj)) ? [] : {});
				this._sub += 1;
				if (this._deep && sub > 20) {
					return (out);
				}

				for (var i in obj) {
					if (obj.hasOwnProperty(i)) {
						if (($.is.object(obj[i]) || $.is.array(obj[i])) && obj[i] !== null) {
							var circle = false;
							for (var x in this._hash) {
								if (this._hash[x] == obj[i]) {
									circle = true;
									break;
								}
							}
							if (circle) {
								out[i] = 'circular';
							} else {
								this._hash.push(obj);
								out[i] = this._format(obj[i], sub + 1);
							}
						} else {
							out[i] = obj[i];
						}
					}
				}
				return (out);
			}
		};
		return (function(obj, m) {
			if (obj == null || (!$.is.array(obj) && !$.is.object(obj))) {
				return (obj);
			}

			if (obj instanceof Date) {
				return (new Date(obj.getTime()));
			}

			try {
				return (this.merge().deep((new copy(obj)).copy, m));
			} catch (e) {
				console.log(e);
			}
			return (null);
		});
	})()
};

module.exports = obj;
