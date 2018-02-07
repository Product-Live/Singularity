"use strict";
$.require([
    //
], function(
    //
) {

    var obj = function() {};
    obj.prototype = {
        clean: function(arr) {
            var out = [];
            for (var i in arr) {
                if ($.defined(arr[i])) {
                    out.push(arr[i]);
                }
            }
            return (out);
        },

        compact: function(arr) {
            if (!$.is.array(arr)) {
                throw new Error('expected array as argument')
            }
            const out = [];
            for (let i in arr) {
                if ($.is.array(arr[i])) {
                    let tmp = this.compact(arr[i]);
                    for (let i in tmp) {
                        out.push(tmp[i]);
                    }
                } else {
                    out.push(arr[i]);
                }
            }
            return (out);
        },

        clone: function(arr) {
            if ($.is.array(arr)) {
                return arr.slice();
            }
            return null;
        },

        range: function(start, stop, step) {
            var out = [];
            if (!$.defined(stop) && $.defined(step)) {
                for (var i = 0; i < start; i++) {
                    out.push(i);
                }
            } else {
                for (var i = start; i < stop; i += step) {
                    out.push(i);
                }
            }
            return (out);
        },

        find: function(arr, value) {
            for (var i in arr) {
                if (arr[i] == value) {
                    return (i)
                }
            }
            return (null);
        },

        findLast: function(arr, value) {
            var find = null;
            for (var i in arr) {
                if (arr[i] == value) {
                    find = i;
                }
            }
            return (find);
        },

        unique: function(arr, sort) {
            var found = {}, out = [];
            for (var i in arr) {
                if (!found[arr[i]]) {
                    out.push(arr[i]);
                    found[arr[i]] = true;
                }
            }
            return ((sort)? out.sort() : out);
        },

        first: function(arr) {
            return (arr[0] || null);
        },

        last: function(arr) {
            return (arr[Math.max(0, arr.length - 1)] || null);
        },

        map: function(arr, key) {
            var out = {};
            if ($.is.array(arr)) {
                for (var i in arr) {
                    out[key(arr[i])] = arr[i];
                }
            }
            return (out);
        }
    };

    module.exports = obj;
});
