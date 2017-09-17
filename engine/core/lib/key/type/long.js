"use strict";

var crypto = $.require('node!crypto');

var obj = function(core) {
    this._core = core;
};
obj.prototype = $.extends('lib!key/base', {
    /**
     * Use plain but hash it with the app salt
     *
     * @returns {*}
     */
    generate: function() {
        var config = $.config.get('crypto');

        var sub = crypto.createHash(config.type);
        sub.update(config.salt + this._core.generate('plain') + $.config.get('env.session'));

        return (sub.digest('hex'));
    }
});

module.exports = obj;
