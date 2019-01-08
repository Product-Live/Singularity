"use strict";

$.require([
    //
], function(
    //
) {

    var obj = function () {};
    obj.prototype = {
        escape: function(str) {
            return (($.is.string(str) || $.is.number(str)) ? str.replace(/\\([\s\S])|(")/g, "\\$1$2") : '');
        },
        cleanup: function(str) {
            return (($.is.string(str)) ? this.escape(str.replace(/[;\s]/g, '')) : '');
        },
        alpha: function(str) {
            return (($.is.string(str)) ? str.replace(/[^a-zA-Z0-9]*/g, '') : '');
        },
        version: function(str) {
            return (($.is.string(str)) ? str.replace(/[^-_:\./a-zA-Z0-9]*/g, '') : '');
        },
        sigPath: function(str) {
            return (($.is.string(str)) ? str.replace(/[^!-_\./a-zA-Z0-9]*/g, '') : '');
        }
    };

    module.exports = new obj();
});