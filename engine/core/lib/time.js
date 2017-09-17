"use strict";

var obj = function() {
	this.get = 0;

	this._value = {
		second: 1000,
		minute: 1000 * 60,
		hour: (1000 * 60) * 60,
		day: ((1000 * 60) * 60) * 24
	}
};
obj.prototype = {
	_add: function(a) {
		this.get += a;
		return (this);
	},

	second: function(a) {
		return (this._add(a * this._value.second));
	},
	minute: function(a) {
		return (this._add(a * this._value.minute));
	},
	hour: function(a) {
		return (this._add(a * this._value.hour));
	},
	day: function(a) {
		return (this._add(a * this._value.day));
	},
	s: function(a) {
		return (this._add(a * this._value.second));
	},
	m: function(a) {
		return (this._add(a * this._value.minute));
	},
	h: function(a) {
		return (this._add(a * this._value.hour));
	},
	d: function(a) {
		return (this._add(a * this._value.day));
	},
	ms: function(a) {
		return (this._add(a));
	}
};

module.exports = {
	second: function(a) {
		return ((new obj()).second(a));
	},
	minute: function(a) {
		return ((new obj()).minute(a));
	},
	hour: function(a) {
		return ((new obj()).hour(a));
	},
	day: function(a) {
		return ((new obj()).day(a));
	},
	s: function(a) {
		return ((new obj()).s(a));
	},
	m: function(a) {
		return ((new obj()).m(a));
	},
	h: function(a) {
		return ((new obj()).h(a));
	},
	d: function(a) {
		return ((new obj()).d(a));
	},
	ms: function(a) {
		return ((new obj()).ms(a));
	},
	now: function() {
		return ((new obj()).ms(new Date().getTime()));
	},
	is: function(o) {
		return (o instanceof obj);
	}
};