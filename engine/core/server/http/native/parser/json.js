"use strict";

$.require([
    'core!/server/http/native/parser/base.js'
], function(
    base
) {

    var obj = function(req, res) {
        this._req = req;
        this._res = res;
    };

    obj.prototype = $.extends(base, {
        get: function() {
            return (this.fetch().then(function(body) {
                return ({parsed: $.json.parse(body) || {}, raw: body});
            }));
        }
    });

    module.exports = obj;
});