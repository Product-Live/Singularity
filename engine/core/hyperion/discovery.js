"use strict";

$.require([
	//
], function(
	//
) {

    var action = function(wrap) {
        this._wrap = wrap;
    };
    action.prototype = {
        test: function(data) {
            if (this._wrap.test) {
                return (this._wrap.test(data));
            }
            return($.promise().resolve());
        }
    };

	var obj = function() {
        this._list = {};
    };
	obj.prototype = {
        add: function(key, build) {
            this._list[key] = build;
        },

        get: function(key) {
            if (this._list[key]) {
                return (new action(this._list[key]));
            }
        }
	};

	module.exports = new obj();
});