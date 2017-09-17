"use strict";

var obj = function() {
    this._keys = {};
};
obj.prototype = $.extends('!base', {
    /**
     * Add more key type object
     *
     * @param name
     * @param key
     * @returns {obj}
     */
    add: function(name, key) {
        this._keys[name] = key;
        return (this);
    },

    /**
     * Gen key with a type name
     *
     * @param name
     * @param param
     * @returns {*|String|string}
     */
    generate: function(name, param) {
        if ($.defined(this._keys[name])) {
           return (this._keys[name].generate(param || {}));
        }
        throw new Error('missing key generate with the name', name);
    },

    format: function() {
        var list = {}, self = this, add = function(name) {
            return (function(param) {
                return (self.generate(name, param));
            })
        };
        for (var i in this._keys) {
            list[i] = add(i);
        }
        return (list);
    }
});

module.exports = obj;
