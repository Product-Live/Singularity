"use strict";

var obj = function() {};
obj.prototype = {
	cleanMongo: function(data, type, o) {
		o = o || {};
		for (var i in data) {
			let k = (type)? i.replace(/#/g, '.') : i.replace(/\./g, '#');
			o[k] = ($.is.object(data[i]) && !$.is.array(data[i])) ? this.cleanMongo(data[i], type, {}) : data[i];
		}
		return (o);
	},

	sleep: function(time) {
		var p = new $.promise();
		if (!time) {
			return (p.resolve());
		}
		setTimeout(function() {
			p.resolve();
		}, time);
		return (p);
	},
	
	timeout: function(time) {
		var p = new $.promise();
		if (!$.is.number(time) || time <= 0) {
			return (p.resolve());
		}
		setTimeout(function () {
			p.resolve()
		}, time);
		return (p);
	}
};

module.exports = obj;
