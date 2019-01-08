"use strict";

var crypto = $.require('node!crypto');

var obj = function(core) {
    this._core = core;
    this.count = 0;
    this.prevSecond = 0;

    this.seed = this._core.generate('seed');
    this.alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';
    this.shuffled = null;
};
obj.prototype = $.extends('lib!key/base', {
    /**
     * Shuffle char set using seed
     *
     * @returns {*}
     */
    shuffle: function() {
        if (!$.defined(this.shuffled)) {
            var char = this.alphabet.split(''), out = [];

            while (char.length > 0) {
                out.push(char.splice(Math.floor(this.seed.next() * char.length), 1)[0]);
            }

            return (this.shuffled = out.join(''));
        }
        return (this.shuffled);
    },

    /**
     * Random byte from crypto
     *
     * @returns {number}
     */
    randomByte: function() {
        return (crypto.randomBytes(1)[0] & 0x30);
    },

    /**
     * Encode of the shuffled char list with a random byte
     *
     * @param number
     * @returns {string}
     */
    encode: function(number) {
        var str = '', i = 0, done = false, list = this.shuffle();

        while (!done) {
            str = str + list[((number >> (4 * i)) & 0x0f) | this.randomByte()];
            done = (number < (Math.pow(16, i + 1)));
            i++;
        }

        return (str);
    },

    /**
     * Create a short key
     *
     * @returns {*}
     */
    generate: function() {
        var str = '', now = Math.floor(this.now() * 0.001);
        if (this.prevSecond == now) {
            this.count += 1;
        } else {
            this.prevSecond = now;
            this.count = 0;
        }

        str += this.encode($.config.get('uniqueKey.version'));
        str += this.encode(1 % 16); // worker id
        if (this.count > 0) {
            str += this.encode(this.count);
        }
        str += this.encode(now);

        return (this.padding(str, 12));
    }
});

module.exports = obj;
