"use strict";

var obj = function(core) {
    this._core = core;
    this._count = 0;
    this._prevSecond = 0;
};
obj.prototype = $.extends('lib!key/base', {
    /**
     * Create a key from (time + count) padded with the version (40)char
     *
     * @param param
     * @returns {*}
     */
    generate: function(param) {
        var now = Math.floor(this.now() * 0.001);
        if (this._prevSecond == now) {
            this._count += 1;
        } else {
            this._prevSecond = now;
            this._count = 0;
        }


        return (this.padding(this.randomKey(1) + now + '' + this._count, 39) + this.version());
    }
});

module.exports = obj;
