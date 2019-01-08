"use strict";


var obj = function(list) {
    this._formatList = list;
    this._data = {};

    var self = this, runChain = function(name) {
        return (function (data) {
            var list = self._formatList[name], side = ($.defined(data)) ? 1 : 0;
            var tmp = data || self._data, source = tmp;
            for (var i in list) {
                if ($.is.function(list[i][side])) { //TODO: can add promise support here
                    tmp = list[i][side](tmp, source);
                }
            }
            if (side == 1) {
                self._data = tmp;
            }
            return (tmp);
        });
    };

    for (var i in this._formatList) {
        this[i] = runChain(i);
    }
};
obj.prototype = {};

module.exports = obj;

/*

    $.cog()('json', function(data) {

        return (data);
    }, function(data) {

        return (data);
    })('api3', 'module!/cog/current/api3', [function(data) {

         return (data);
    }, function(data) {

        return (data);
    }])
 */