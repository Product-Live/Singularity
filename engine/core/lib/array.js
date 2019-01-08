"use strict";
$.require([
    //
], function(
    //
) {

    var obj = function() {};
    obj.prototype = {
        /**
         * clear a array of empty values like null or undefined
         *
         * @param  {[type]} arr [description]
         * @return {[type]}     [description]
         */
        clean: function(arr) {
            var out = [];
            for (var i in arr) {
                if ($.defined(arr[i])) {
                    out.push(arr[i]);
                }
            }
            return (out);
        },

        /**
         * compress all sub arrays in a given array into a single array
         *
         * @param  {[type]} arr [description]
         * @return {[type]}     [description]
         */
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

        /**
         * slice the whole array into a new array
         *
         * @param  {[type]} arr [description]
         * @return {[type]}     [description]
         */
        clone: function(arr) {
            if ($.is.array(arr)) {
                return arr.slice();
            }
            return null;
        },

        /**
         * create a array with a number pattern
         *
         * @param  {[type]} start [description]
         * @param  {[type]} stop  [description]
         * @param  {[type]} step  [description]
         * @return {[type]}       [description]
         */
        range: function(start, stop, step) {
            let out = [];
            if (!$.defined(stop) && !$.defined(step)) {
                for (let i = 0; i < start; i++) {
                    out.push(i);
                }
            } else {
                for (let i = start; i < stop; i += step) {
                    out.push(i);
                }
            }
            return (out);
        },

        /**
         * find a element in a array and return it's key
         *
         * @param  {[type]} arr   [description]
         * @param  {[type]} value [description]
         * @return {[type]}       [description]
         */
        find: function(arr, value) {
            for (let i in arr) {
                if (arr[i] == value) {
                    return (i)
                }
            }
            return (null);
        },

        /**
         * find the last occurence of a value in a array and return it's key
         *
         * @param  {[type]} arr   [description]
         * @param  {[type]} value [description]
         * @return {[type]}       [description]
         */
        findLast: function(arr, value) {
            let find = null;
            for (let i in arr) {
                if (arr[i] == value) {
                    find = i;
                }
            }
            return (find);
        },

        /**
         * create a array withoug all the duplicate values
         *
         * @param  {[type]} arr  [description]
         * @param  {[type]} sort [description]
         * @return {[type]}      [description]
         */
        unique: function(arr, sort) {
            let found = {}, out = [];
            for (let i in arr) {
                if (!found[arr[i]]) {
                    out.push(arr[i]);
                    found[arr[i]] = true;
                }
            }
            return ((sort)? out.sort() : out);
        },

        /**
         * fetch the first element of a array
         *
         * @param  {[type]} arr [description]
         * @return {[type]}     [description]
         */
        first: function(arr) {
            return (arr[0] || null);
        },

        /**
         * fetch the last element of a array
         *
         * @param  {[type]} arr [description]
         * @return {[type]}     [description]
         */
        last: function(arr) {
            return (arr[Math.max(0, arr.length - 1)] || null);
        },

        /**
         * map out the array into a object
         *
         * @param  {[type]} arr [description]
         * @param  {[type]} key [description]
         * @return {[type]}     [description]
         */
        map: function(arr, key) {
            let out = {};
            if ($.is.array(arr)) {
                for (let i in arr) {
                    out[key(arr[i])] = arr[i];
                }
            }
            return (out);
        }
    };

    module.exports = obj;
});
