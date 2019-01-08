"use strict";

$.require([
    //
], function(
    //
) {

    var obj = function(file) {
        this._file = file;
    };
    obj.prototype = $.extends('!base', {
        run: function() {
            return $.promise().resolve();
        }
    });

    module.exports = obj;
});
