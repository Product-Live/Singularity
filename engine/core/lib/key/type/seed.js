"use strict";

$.require([
    'lib!key/seed.js'
], function(
    seed
) {

    var obj = function (core) {
        this._core = core;
    };
    obj.prototype = $.extends('lib!key/base', {
        /**
         * Create new seed using the machine session as root
         *
         * @param s
         * @returns {*}
         */
        generate: function(s) {
            return (new seed(($.is.int(s))? s : Number($.config.get('env.session'))));
        }
    });

    module.exports = obj;
});