"use strict";

var obj = function(arg) {
    this._arg = arg.splice(2, arg.length - 1);
    this._format = {
        options: [],
        argument: []
    };
    this._map = {};
};

obj.prototype = $.extends('!base', {
    /**
     * Get the alias for a option
     *
     * @param a
     * @returns {Array}
     * @private
     */
    _getMap: function(a) {
        var out = [];
        if (Array.isArray(a)) {
            for (var i in a) {
                out.push(($.defined(this._map[a[i]])) ? this._map[a[i]] : a[i]);
            }
        } else {
            out.push(($.defined(this._map[a])) ? this._map[a] : a);
        }
        return (out);
    },

    /**
     * is this a option?
     *
     * @param str
     * @returns {boolean}
     * @private
     */
    _isOption: function(str) {
        return (str[0] == '-');
    },

    /**
     * parse the string given and create a map of option with argument
     *
     * @returns {obj}
     */
    parse: function() {
        var i = 0;
        while (i < this._arg.length) {
            if (this._arg[i][0] == '-') {
                if (this._arg[i].length == 2) {
                    this._format.options.push({
                        option: this._getMap(this._arg[i][1])[0],
                        argument: ((i + 1) < this._arg.length && !this._isOption(this._arg[i + 1])) ? this._arg[i + 1] : null
                    });
                    i += ((i + 1) < this._arg.length && !this._isOption(this._arg[i + 1])) ? 1 : 0;
                } else {
                    var a = (this._arg[i][1] == '-') ? this._getMap(this._arg[i].substr(2)) : this._getMap((this._arg[i].substr(1)).split(''));
                    if (a.length == 1) {
                        this._format.options.push({
                            option: a[0],
                            argument: ((i + 1) < this._arg.length && !this._isOption(this._arg[i + 1])) ? this._arg[i + 1] : null
                        });
                        i += ((i + 1) < this._arg.length && !this._isOption(this._arg[i + 1])) ? 1 : 0;
                    } else {
                        for (var x in a) {
                            this._format.options.push(a[x]);
                        }
                    }
                }
            } else {
                this._format.argument.push(this._arg[i]);
            }
            i += 1;
        }
        return (this);
    },

    /**
     * Add alias for a option
     *
     * @param a
     * @returns {obj}
     */
    setMap: function(a) {
        for (var i in a) {
            if (Array.isArray(a[i]) || typeof(a[i]) === 'string') {
                if (Array.isArray(a[i])) {
                    for (var x in a[i]) {
                        this._map[a[i][x]] = i;
                    }
                } else {
                    this._map[a[i]] = i;
                }
            }
        }
        return (this);
    },

    /**
     * Get value for a option if there is one
     *
     * @param a
     * @returns {*}
     */
    get: function(a) {
        var option = this._getMap(a)[0];
        for (var i in this._format.options) {
            if (typeof(this._format.options[i]) == 'object' && this._format.options[i].option == option) {
                return (this._format.options[i].argument);
            }
        }
        return (null);
    },

    /**
     * List arguments
     *
     * @returns {Array}
     */
    getArguments: function () {
        return (this._format.argument);
    }
});

module.exports = obj;