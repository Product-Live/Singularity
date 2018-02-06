"use strict";

var obj = function() {};
obj.prototype = {
	_type: {
		int: true,
		float: true,
		string: true,
		object: true,
		bool: true,
		array: true,
		time: true,
		func: true,
		function: true
	},
	type: function(k) {
		return ($.defined(this._type[k]) && this._type[k]);
	},
	int: function(a) {
		return (!isNaN(a) && a !== '' && (typeof(a) === 'number' || typeof(a) === 'string') && Number(a) == a);
	},
	number: function(a) {
		return this.int(a);
	},
	float: function(a) {
		return (this.int(a)); // does not check if it's a float or int
	},
	string: function(a) {
		return (typeof(a) === 'string');
	},
	object: function(a) {
		return (typeof(a) === 'object' && a != null && !this.array(a));
	},
	bool: function(a) {
		return (typeof(a) === 'boolean');
	},
	array: function(a) {
		return (typeof(a) === 'object' && Array.isArray(a));
	},
	time: function(a) {
		return (this.instance(a, Date) || ((this.string(a) || this.int(a)) && new Date(a).toString() !== 'Invalid Date'));
	},
	func: function(a) {
		return (typeof(a) === 'function');
	},
	function: function(a) {
		return (this.func(a));
	},
	defined: function(a) {
		return $.defined(a);
	},

	phoneNumber: function(a) {
		return (/\+[0-9]{11}$/g.test(a));
	},

	/**
	* Test url (https://mathiasbynens.be/demo/url-regex)
	*
	* @param url
	* @returns {boolean}
	*/
	url: function(url) {
		return (/^(https?|ftp):\/\/[^\s\/$.?#].[^\s]*$/im.test(url));
	},

	/**
	* Test email (http://emailregex.com/)
	*
	* @param email
	* @returns {boolean}
	*/
	email: function(email) {
		return (/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email));
	},

	/**
	* Is Instance of a object
	*
	* @param a
	* @param b
	* @returns {boolean}
	*/
	instance: function(a, b) {
		if ($.is.object(a) && $.is.func(b)) {
			try {
				return (a instanceof b);
			} catch(e) {
				return false;
			}
		}
		return false;
	},

	/**
	* Is A not found in B's array
	*
	* @param a
	* @param b
	* @returns {boolean}
	*/
	not: function(a, b) {
		if (this.array(b)) {
			for (var i in b) {
				if (b[i] == a) {
					return (false);
				}
			}
			return (true);
		}
		return (a != b);
	},

	/**
	* Does a have a value in b
	*
	* @param a
	* @param b
	* @returns {boolean}
	*/
	got: function(a, b) {
		if (this.object(a)) {
			var c = 0, found = [];
			for (var i in a) {
				if (!this.not((this.array(a)) ? a[i] : i, b)) {
					c += 1;
					found.push((this.array(a)) ? a[i] : i);
				}
			}
			return (c == b.length);
		}
		return (!this.not(a, b));
	},

	/**
	* Take what is valid
	*
	* @param a
	* @param b
	* @returns {*}
	*/
	default: function(a, b) {
		return ($.defined(a) ? a : b);
	},


	/**
	* Is value give empty
	*
	* @param obj
	* @returns {boolean}
	*/
	empty: function(obj) {
		if (!$.defined(obj)) {
			return (true);
		}
		if (obj.length === 0) {
			return (true);
		}
		for (var i in obj) {
			if (hasOwnProperty.call(obj, i)) {
				return (false);
			}
		}

		return (true);
	}
};

module.exports = obj;
