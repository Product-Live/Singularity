"use strict";
$.require([
    //
], function(
    //
) {

    var obj = function() {};
    obj.prototype = {
        keys: function(obj) {
            var out = [];
            for (var i in obj) {
                out.push(i);
            }
            return (out);
        },

        values: function(obj) {
            var out = [];
            for (var i in obj) {
                out.push(obj[i]);
            }
            return (out);
        },

        pairs: function() {
            var out = [];
            for (var i in obj) {
                out.push([i, obj[i]]);
            }
            return (out);
        },

        clean: function(obj) {
            var out = {};
            for (var i in obj) {
                if ($.defined(obj[i])) {
                    out[i] = obj[i];
                }
            }
            return (out);
        },

        extends: function(base, obj) {
            return ($.extends(base, obj));
        },

        extend: function(base, obj) {
            return (this.extends(base, obj));
        },

        clone: function(obj) {
            return ($.schema.copy(obj));
        }
    };

    module.exports = obj;
});