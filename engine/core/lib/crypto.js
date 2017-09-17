"use strict";

var crypto = require('crypto');

var obj = function() {};
obj.prototype = {
	encrypt: function(type, password, text) {
		var cipher = crypto.createCipher(type, password);
		var encrypted = cipher.update(text, 'utf8', 'hex');
		encrypted += cipher.final('hex');
		return (encrypted);
	},

	decrypt: function(type, password, text) {
		var decipher = crypto.createDecipher(type, password);
		var dec = decipher.update(text, 'hex', 'utf8');
		dec += decipher.final('utf8');
		return (dec);
	},

	hash: function(data, type) {
		var sub = crypto.createHash(type || 'sha256');
		sub.update(data);
		return (sub.digest('hex'));
	},
	
	btoa: function(data) {
		return new Buffer(data).toString('base64');
	},

	atob: function(data) {
		return new Buffer(data, 'base64').toString('ascii');
	},

	/**
	 * Timing safe equals
	 *
	 * @param a
	 * @param b
	 * @returns {boolean}
	 */
	equal: function(a, b) {
		var valid = true, length = Math.max(a.length, b.length);
		for (var i = 0; i < length; i++) {
			if (a[i] !== b[i]) {
				valid = false;
			}
		}
		return (valid);
	}
};

module.exports = new obj();