"use strict";

var obj = function(v) {
    this._version = this._parse(v);
};
obj.prototype = {
    _parse: function(v) {
        var a = ((($.is.string(v))? v : '').match(/\d.*\d/) || [''])[0].split(/[^\d]/);
        for (var i = 0; i < 3; i++) {
            a[i] = Number(a[i]);
        }
        return (a);
    },
    
    great: function(v) {
        var tmp = this._parse(v);
        for (var i = 0; i < this._version.length; i++) {
            if (this._version[i] < tmp[i]) {
                return false
            } else if (this._version[i] > tmp[i]) {
                break;
            }
        }
        return (true);
    },

    less: function(v) {
        var tmp = this._parse(v);
        for (var i in this._version) {
            if (this._version[i] < tmp[i]) {
                return (false);
            }
        }
        return (true);
    },

    equal: function(v) {
        var tmp = this._parse(v);
        for (var i in this._version) {
            if (this._version[i] == tmp[i]) {
                return (false);
            }
        }
        return (true);
    }
};

module.exports = obj;
