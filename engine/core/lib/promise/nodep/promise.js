"use strict";

var obj = function() {
	if (this instanceof obj) {
		this._chain = [];
		this._sync = [];
		this._key = 0;
		this._catch = {
			chain: [],
			sync: []
		};
	} else {
		var p = new obj();
		return p;
		/* return ({
		 resolve: function(res) {
		 return (p.resolve(res));
		 },
		 reject: function(res) {
		 return  (p.reject(res));
		 }
		 });*/
	}
};
obj.prototype = {
	_throw: function(data) {
		var _catch = this._catch.chain.splice(0, 1)[0];
		if (_catch) {
			this._key = _catch.key;
			this._bind(_catch.callback(data));
		} else {
			if (this._catch.sync.length == 0) {
				this._catch.sync.push({data: data});
			} else {
				throw new Error('catch called twice.');
			}
		}
	},
	_bind: function(out) {
		var self = this;
		if (out instanceof obj || out instanceof Promise) {
			out.then(function(res) {
				self._next(res, 1);
			}, function(err) {
				self._next(err, -1);
			}).catch(function(data) {
				self._throw(data);
			});
		} else {
			if (typeof(out) != 'undefined') {
				this._next(out, 1);
			}
		}
	},
	_next: function(data, type) {
		var link = this._chain[this._key];
		if (link) {
			if (typeof(link[type]) == 'function') {
				this._key += 1;
				this._bind(link[type].apply({
					reject: function(res) {
						var p = new obj();
						return  (p.reject(res));
					}
				}, [data]));
			} else {
				if (type == -1) {
					this._throw(data);
				}
			}
		} else {
			if (this._sync.length == 0) {
				this._sync.push({data: data, type: type});
			} else {
				throw new Error('resolved promise twice.');
			}
		}
		return (this);
	},
	promise: function() {
		return (new obj());
	},

	resolve: function(res) {
		if (this._key != 0) {
			throw new Error('resolved promise twice.');
		}
		return (this._next(res, 1));
	},
	reject: function(err) {
		if (this._key != 0) {
			throw new Error('resolved promise twice.');
		}
		return (this._next(err, -1));
	},
	then: function(resolve, reject) {
		this._chain.push({'1': resolve, '-1': reject});
		var sync = this._sync.splice(0, 1)[0];
		if (sync) {
			this._next(sync.data, sync.type);
		}
		return (this);
	},
	catch: function(func) {
		if (typeof(func) == 'function') {
			this._catch.chain.push({
				key: this._chain.length,
				callback: func
			});
		}

		var sync = this._catch.sync.splice(0, 1)[0];
		if (sync) {
			var _catch = this._catch.chain.splice(0, 1)[0];
			if (_catch) {
				this._key = _catch.key;
				this._bind(_catch.callback(sync.data));
			}
		}
		return (this);
	},
	wait: function(time, data) {
		var p = new obj();

		if (!isNaN(time)) {
			setTimeout(function () {
				p.resolve(data)
			}, time);
		} else {
			p.reject();
		}

		return (p);
	}
};

module.exports = obj;