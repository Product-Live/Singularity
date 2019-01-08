"use strict";

var obj = function(core) {
    this._core = core;
};
obj.prototype = $.extends('lib!key/base', {
    /**
     * Gen key with time and padded to be 40 char
     *
     * @returns {*}
     */
    generate: function() {
        var now = $.time.now().get, length = 40;
        return (now + this.randomKey(length - (now + '').length, '0123456789'));
    }
});

module.exports = obj;
