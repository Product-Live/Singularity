"use strict";

var obj = function(param) {
	if (this instanceof obj) {
        this._param = param || {};
        this._debugConfig = this._param.debug || false;
		this._back = 0;
		this._chain = [];
		this._parent = null;
		this._sync = {got: false, res: null, func: null};
		this._responce = false;
        this._called = false;
	} else {
		var p = new obj(param);
		return ({
			resolve: function(res) {
				return (p.resolve(res));
			},
			reject: function(res) {
				return  (p.reject(res));
			},
			then: function(cb, cbErr) {
				return  (p.then(cb, cbErr));
			}
		});
	}
};
obj.prototype = {
    /**
     * Used to print debug message
     *
     * @returns {obj}
     * @private
     */
    _debug: function() {
        if (this._debugConfig) {
            var out = [this._debugConfig];
            for (var i in arguments) {
                out.push(arguments[i]);
            }
            console.log.apply(console.log, out);
            console.log('-');
            return (this);
        }
    },

    /**
     * Set the parent of promise
     *
     * @param p
     * @param type
     * @returns {obj}
     * @private
     */
	_setParent: function(p, type) {
        this._debug('-- change parent', type, this._parent, 'to', p, this);
		this._parent = p;
		return (this);
	},

    /**
     * Run a resolved promise that fell into a sync state
     * @private
     */
	_syncRun: function() {
		if (this._sync.got) {
			var res = this._sync.res, func = this._sync.func;
            this._debug('-- sync run on', this._sync);
            this._sync = {got: false, res: null, func: null};
			this.__run(res, func);
		}
	},

    /**
     * Resolve the state of the promise by merging chains and pushing chain resolutions up the parent tree (hell to debug)
     *
     * @param data
     * @param func
     * @private
     */
	__run: function(res, func) {
		if (this._parent == null) {
			if (this._back < this._chain.length) {
                this._debug('-- current call in chain', this._chain[this._back].callback.resolve, this._chain[this._back].callback.reject, this._back);
				var call = this._chain[this._back].callback[func], out = undefined;
                this._debug('-- current call is', call, res, func);
				if (typeof(call) === 'function') {
					out = call(res);
                    //this._debug('-- call block in chain', this._chain[this._back], this._back, out, this._chain, 'func', this._chain[this._back].callback[func]);
				}
				
				if (typeof(out) !== 'undefined') {
					if (out instanceof obj) {
                        this._debug('-- callback returned a promise', out);
						if ($.defined(this._chain[this._back])) {  //does the current block in chain exist
                            this._chain[this._back].promise = out._setParent(this, '1'); // set both the current call and last chain parent
                            this._back += 1;

                            if (this._debugConfig) { // chain the debug
                                out._debugConfig = this._debugConfig + '->child';
                            }

                            if (out._chain.length != 0) {
                                for (var i in out._chain) {
                                    var id = this._back + Number(i);
                                    this._debug('-- add from returned promise', out._chain[i], id);
                                    this._chain.splice(id, 0, out._chain[i]);
                                    this._chain[id].promise = this._chain[id].promise._setParent(this, '2');
                                }
                                this._back += out._back;
                            } else {
                                this._debug('-- out chain is empty', out);
                            }
							out._chain = [];
							out._syncRun();
						} else {
							this._sync = {got: true, res: res, func: func};
							out._sync = {got: false, res: null, func: null};
						}
					} else {
                        if (out instanceof Promise) {
                            var _self = this;
                            out.then(function (r) {
                                _self._back += 1;
                                _self.__run(r, 'resolve');
                            });
                        } else {
                            this._back += 1;
                            this.__run(out, 'resolve');
                            // maybe do something else??
                        }
					}
				}
			} else {
                this._sync.got = true;
                this._sync.res = res;
                this._sync.func = func;
			}
		} else {
            this._parent.__run(res, func);
		}
	},

    /**
     * Add a link in the chain of events
     *
     * @param resolve
     * @param reject
     * @returns {obj}
     */
	then: function(resolve, reject) {
        if (this._parent == null) {
            this._chain.push({callback: {resolve: resolve, reject: reject}, promise: this});
            this._syncRun();
            this._debug('-- chain then added', resolve, reject, 'chain length', this._chain.length);
        } else {
            this._parent._chain.push({callback: {resolve: resolve, reject: reject}, promise: this});
            this._parent._syncRun();
            this._debug('-- adding to chain on parent', resolve, reject, 'chain length', this._chain.length);
        }
		return (this);
	},

    /**
     * Resolve a promise pushing a success up the chain
     *
     * @param res
     * @returns {obj}
     */
	resolve: function(res) {
        if (!this._called) {
            this._debug('-- resolve ', res, this);
            this.__run(res, 'resolve');
            this._called = true;
        } else {
            if (this._param.fatal) {
                throw new Error('promise tried to be resolved twice');
            }
        }
		return (this);
	},

    /**
     * Reject a promise pushing a error up the chain
     *
     * @param res
     * @returns {obj}
     */
	reject: function(res) {
        if (!this._called) {
            this._debug('-- reject ', res, this);
		    this.__run(res, 'reject');    this._called = true;
        } else {
            if (this._param.fatal) {
                throw new Error('promise tried to be resolved twice');
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
        return p;
    }

};

module.exports = obj;
