"use strict";

var obj = function() {};
obj.prototype = {
    number: function (a) {
        return (Number(a));
    },
    
    int: function (a) {
        return (this.number(a));
    },

    string: function (a) {
        return (a + '');
    },

    bool: function (a) {
        return (Boolean(a));
    }
};

module.exports = obj;