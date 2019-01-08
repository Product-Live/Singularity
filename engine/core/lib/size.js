var obj = function() {
	this.get = 0;

	this._value = {
		byte: 1,
		kilobyte: Math.pow(2, 10),
		megabyte: Math.pow(2, 20),
		gigabyte: Math.pow(2, 30)
	}
};
obj.prototype = {
	_add: function(a) {
		this.get += a;
		return (this);
	},

	byte: function(a) {
		return (this._add(a * this._value.byte));
	},
	kilobyte: function(a) {
		return (this._add(a * this._value.kilobyte));
	},
	megabyte: function(a) {
		return (this._add(a * this._value.megabyte));
	},
	gigabyte: function(a) {
		return (this._add(a * this._value.gigabyte));
	}
};

module.exports = {
	byte: function(a) {
		return ((new obj()).byte(a));
	},
	kilobyte: function(a) {
		return ((new obj()).kilobyte(a));
	},
	megabyte: function(a) {
		return ((new obj()).megabyte(a));
	},
	gigabyte: function(a) {
		return ((new obj()).gigabyte(a));
	}
};