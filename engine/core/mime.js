"use strict";

$.require([
    'core!/mime/default.js'
], function(
    defaultList
) {

    var obj = function () {
        this.type = {};
        this._default = 'text/plain';
        this.load(defaultList);
    };
    obj.prototype = $.extends('!base', {
        load: function(map) {
            for (var i in map) {
                for (var x in map[i]) {
                    this.type[map[i][x]] = i;
                }
            }
            return (this);
        },
        lookup: function(file, defaultType) {
            if (!$.is.string(file)) {
                return (defaultType || this._default);
            }
            return (this.type[file.replace(/.*[\.\/\\]/, '').toLowerCase()] || defaultType || this._default);
        }
    });

    module.exports = new obj();
});