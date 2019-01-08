"use strict";

var obj = function(param) {
    if (this instanceof obj) {
        var self = this;
        this._p = new Promise(function(cb, cbErr) {
            if (cb) {
                self.cb = cb;
            }
            if (cbErr) {
                self.cbErr = cbErr;
            }
        })
    } else {
        return new obj();
    }

};
obj.prototype = {
    resolve: function(res) {
        this.cb(res);
        return (this);
    },
    reject: function(err) {
        this.cbErr(err);
        return (this);
    },
    then: function(cb, cbErr) {
        return this._p.then(cb, cbErr);
    },
	deferredLoop: function (arrayList, options, cb, cbErr) {
		var self = this,
			def = obj,
			_all = $.require('lib!/promise/em6/all.js');
		options = options || {};
		options.dl_ind = options.dl_ind || 0;
		options.dl_together = options.dl_together || 5;
		options.dl_cpt = options.dl_cpt || -1;
		options.dl_previousResult = options.dl_previousResult || [];
		if (!$.defined(arrayList))
			return new def().reject("deferredLoop: None Array Given");
		if (typeof cb !== "function")
			return new def().reject("deferredLoop: None function to execute");
		if (typeof cbErr !== "function")
			cbErr = function(err, opt){return new obj().reject(err);};

		if (!Array.isArray(arrayList)){
			arrayList = Object.keys(arrayList).map(function (key) {return arrayList[key]});
		}

		var dl_ind = options.dl_ind + options.dl_together ;
		var defList = [];

		var range = arrayList.slice(options.dl_ind, dl_ind);
		options.dl_ind = dl_ind;

		range.forEach( function(item) {
			options.dl_cpt += 1;
			defList.push( cb(item, options) );
		});
		return _all(defList).then(function (results) {
			if (Array.isArray(results)){
				for (var i = 0; i < results.length; i++) {
					var result = results[i];
					if (result != null) options.dl_previousResult.push(result);
				}
			}
			return new def().resolve();
		}, function(err){
			return cbErr(err);
		}).then(function () {
			if (dl_ind > arrayList.length -1) {
				return (options.dl_previousResult);
			} else{
				return (self.deferredLoop(arrayList, options, cb, cbErr));
			}
		});
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
