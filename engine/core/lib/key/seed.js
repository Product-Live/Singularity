"use strict";

var obj = function(seed) {
    this._seed = seed || 1;
};
obj.prototype = $.extends('!base', {
    /**
     * Gen next seed
     *
     * @returns {number}
     */
    next: function() {
        this._seed = (this._seed * 9301 + 49297) % 233280;
        return (this._seed / (233280.0));
    },

    /**
     * Set the seed base
     * @param seed
     */
    setSeed: function(seed) {
        this._seed = seed;
        return (this);
    }
});

module.exports = obj;
