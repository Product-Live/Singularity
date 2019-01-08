"use strict";

$.require([
    //
], function(
    //
) {

    var obj = function() {};
    obj.prototype = $.extends('!base', {
        /**
         * Get config for log name config can reload so use func
         *
         * @returns {*}
         * @private
         */
        _config: function() {
            return ($.config.get('console.logger.' + this._name));
        }
    });

    module.exports = obj;
});
