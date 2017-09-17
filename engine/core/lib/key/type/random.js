"use strict";

var crypto = $.require('node!crypto');

var obj = function(core) {
    this._core = core;
};
obj.prototype = $.extends('lib!key/base', {
    /**
     * Create random key
     *
     * @returns {*}
     */
    generate: function(p) {
        return (this.randomKey(p.length || 16, p.char));
    }
});

module.exports = obj;
