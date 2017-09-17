"use strict";
$.require([
    //
], function(
    //
) {

    var obj = function() {};
    obj.prototype = {
        bind: function(func, object, arg) {
            return (function() {
                return (func.apply(object, arg || arguments));
            });
        },

        throttle: function(func, wait) {
            var run = false;
            return (function() {
                if (!run) {
                    run = true;
                    setTimeout(function () {
                        run = false;
                        func();
                    }, wait);
                }
            });
        },

        debounce: function(func, wait) {
            var time = null;
            return (function() {
                clearTimeout(time);
                time = setTimeout(function() {
                    func();
                }, wait);
            });
        },

        once: function(func) {
            var run = false;
            return (function() {
                if (!run) {
                    run = true;
                    func();
                }
            });
        }
    };

    module.exports = obj;
});