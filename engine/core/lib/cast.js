"use strict";

var obj = function() {};
obj.prototype = {
    /**
     * Cast value into a int you if it fails you get NaN
     * @param  {[type]} a [description]
     * @return {[type]}   [description]
     */
    number: function (a) {
        return (Number(a));
    },

    /**
     * alias for number
     * @param  {[type]} a [description]
     * @return {[type]}   [description]
     */
    int: function (a) {
        return (this.number(a));
    },

    /**
     * Cast value to a string
     * @param  {[type]} a [description]
     * @return {[type]}   [description]
     */
    string: function (a) {
        return (($.is.object(a))? a.toString() : (a + ''));
    },

    /**
     * cast value to a Boolean
     * @param  {[type]} a [description]
     * @return {[type]}   [description]
     */
    bool: function (a) {
        return (Boolean(a));
    }
};

module.exports = obj;
