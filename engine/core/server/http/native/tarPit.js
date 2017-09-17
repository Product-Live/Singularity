"use strict";

$.require([
    //
], function(
    //
) {

    // TODO: explore the idea of creating a tarpit if it's a scanning tool?
    var obj = function(req, res) {
        this._req = req;
        this._res = res;
    };
    obj.prototype = $.extends('!base', {
        /**
         * The idea is to detect none normal user then blacklist them and give them random info
         * @returns {boolean}
         */
        isAttack: function() {
            if (this._req.url.match(/(\.\.[\/\\])/)) {
                return (true);
            }
            return (false);
        },

        /**
         *  random response attack with small content
         */
        random: function() {
            this._res.writeHead(Math.floor(Math.random() * 600), {});
            this._res.end('');
        }
    });

    module.exports = obj;
});