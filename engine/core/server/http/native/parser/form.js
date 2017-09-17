"use strict";

$.require([
    'node!querystring',
    'core!/server/http/native/parser/base.js'
], function(
    queryString,
    base
) {

    var obj = function(req, res) {
        this._req = req;
        this._res = res;
        this._max = $.config.get('server.http.maxSize.form');
    };
    obj.prototype = $.extends(base, {
        get: function() {
            return (this.fetch().then(function(body) {
                return ({parsed: queryString.parse(body), body: body});
            }));
        }
    });

    module.exports = obj;
});