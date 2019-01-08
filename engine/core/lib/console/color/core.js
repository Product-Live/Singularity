"use strict";

$.require([
	'lib!console/color/color.js'
], function(
	color
) {

	var obj = function() {
		this._list = [];
	};
	obj.prototype = $.extends('!base', {
        /**
         * Add new color group to list
         *
         * @param ref
         * @param list
         * @returns {obj}
         * @private
         */
		_add: function(ref, list) {
			this._list.push({
				color: new color(ref),
				entry: list
			});
            return (this);
		},

        black: function() {
            return (this._add('black', arguments));
        },
        red: function() {
            return (this._add('red', arguments));
        },
        green: function() {
            return (this._add('green', arguments));
        },
        yellow: function() {
            return (this._add('yellow', arguments));
        },
        blue: function() {
            return (this._add('blue', arguments));
        },
        magenta: function() {
            return (this._add('magenta', arguments));
        },
        cyan: function() {
            return (this._add('cyan', arguments));
        },
        white: function() {
            return (this._add('white', arguments));
        },
        none: function() {
            return (this._add('none', arguments));
        },

        /**
         * Return a array of all entrys
         *
         * @returns {Array}
         */
        toArray: function() {
            var out = [];
            for (var i in this._list) {
                out.push(this._list[i].color.code);
                for (var x in this._list[i].entry) {
                    out.push(this._list[i].entry[x]);
                }
            }
            return (out);
        }
	});

	module.exports = obj;
});
