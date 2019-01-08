"use strict";

var obj = function(core, name, callback) {
    this._core = core;
    this._found = false;

    this._if(name, callback);
};

obj.prototype = $.extends('!base', {

    /**
     * Default if run at start
     *
     * @param name
     * @param callback
     * @private
     */
    _if: function(name, callback) {
        var option = this._core._getMap(name)[0];
        for (var i in this._core._format.options) {
            if (this._core._format.options[i] == option || (typeof(this._core._format.options[i]) == 'object' && this._core._format.options[i].option == option)) {
                this._callback = callback;
                this._callback((typeof(this._core._format.options[i]) == 'object')? this._core._format.options[i].argument : null);
                this._callback = null;
                this._found = true;
                break;
            }
        }
    },

    /**
     * Extra if condition
     *
     * @param name
     * @param callback
     * @returns {obj}
     */
    elseIf: function(name, callback) {
        if (!this._found) {
            this._if(name, callback);
        }
        return (this);
    },

    /**
     * else operation to run if we find nothing
     * @param callback
     * @returns {obj}
     */
    else: function(callback) {
        if (!this._found) {
            this._callback = callback;
            this._callback();
            this._callback = null;
        }
        return (this);
    }
});

module.exports = obj;