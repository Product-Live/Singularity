"use strict";

var crypto = require('crypto');

var obj = function() {};
obj.prototype = {
	/**
	 * encrypt a string
	 *
	 * @param  {[type]} type     [description]
	 * @param  {[type]} password [description]
	 * @param  {[type]} text     [description]
	 * @return {[type]}          [description]
	 */
	encrypt: function(type, password, text) {
		var cipher = crypto.createCipher(type, password);
		var encrypted = cipher.update(text, 'utf8', 'hex');
		encrypted += cipher.final('hex');
		return (encrypted);
	},

	/**
	 * decrypt a string
	 *
	 * @param  {[type]} type     [description]
	 * @param  {[type]} password [description]
	 * @param  {[type]} text     [description]
	 * @return {[type]}          [description]
	 */
	decrypt: function(type, password, text) {
		var decipher = crypto.createDecipher(type, password);
		var dec = decipher.update(text, 'hex', 'utf8');
		dec += decipher.final('utf8');
		return (dec);
	},

	/**
	 * Hash a string
	 *
	 * @param  {[type]} data [description]
	 * @param  {[type]} type [description]
	 * @return {[type]}      [description]
	 */
	hash: function(data, type) {
		var sub = crypto.createHash(type || 'sha256');
		sub.update(data);
		return (sub.digest('hex'));
	},

	/**
	 * convert a string into base64
	 *
	 * @param  {[type]} data [description]
	 * @return {[type]}      [description]
	 */
	btoa: function(data) {
		return new Buffer(data).toString('base64');
	},

	/**
	 * convert base64 into a ascii
	 * @param  {[type]} data [description]
	 * @return {[type]}      [description]
	 */
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

module.exports = obj;
