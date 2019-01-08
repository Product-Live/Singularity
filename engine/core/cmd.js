"use strict";

$.require([
    'core!/cmd/parser.js',
    'core!/cmd/statement.js'
], function(
    parser,
    statement
) {

    var obj = function(arg) {
        this._arg = $.schema.copy(arg);
        this._parser = new parser(this._arg);
    };

    obj.prototype = $.extends('!base', {
        /**
         * Parse the arguments given into a map
         *
         * @returns {obj}
         */
        parse: function() {
            this._parser.parse();
            return (this);
        },

        /**
         * Set up alias for options
         *
         * @param map
         * @returns {obj}
         */
        setMap: function(map) {
            this._parser.setMap(map);
            return (this);
        },

        /**
         * get value for a options
         *
         * @param name
         * @returns {*}
         */
        get: function(name) {
            return (this._parser.get(name));
        },

        /**
         * Create a new if group
         * @param name
         * @param callback
         * @returns {*}
         */
        if: function(name, callback) {
            return (new statement(this._parser, name, callback));
        }
    });

    module.exports = obj;
});