"use strict";

var obj = function() {};
obj.prototype = $.extends('!base', {
    /**
     * Create and random key
     * @param length
     * @param charList
     * @returns {string}
     */
    randomKey: function(length, charList) {
        var text = '', possible = charList || '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';

        for (var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return (text);
    },

    /**
     * Add padding onto string
     *
     * @param str
     * @param length
     * @returns {*}
     */
    padding: function(str, length) {
        return (str + (((length - str.length) > 0) ? this.randomKey(length - str.length) : ''));
    },

    /**
     * Shorter time to be used
     *
     * @returns {number}
     */
    now: function() {
        return ($.time.now().get - $.config.get('uniqueKey.time'));
    },

    /**
     * Version of the keyGen set
     * @returns {*}
     */
    version: function() {
        return ($.config.get('uniqueKey.version'));
    }
});

module.exports = obj;

