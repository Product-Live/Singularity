"use strict";

$.require([
    //
], function(
    //
) {

    var obj = function(data) {
        this._data = data;
    };

    obj.prototype = $.extends('!base', {
        getPath: function() {
            return (this._data.path);
        },
        getName: function() {
            return (this._data.fileName);
        },
        isFile: function() {
            return (true);
        }
    });

    module.exports = obj;
});