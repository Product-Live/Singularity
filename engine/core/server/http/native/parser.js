"use strict";

$.require([
    'core!/server/http/native/parser/multipart.js',
    'core!/server/http/native/parser/json.js',
    'core!/server/http/native/parser/form.js'
], function(
    multipart,
    json,
    form
) {

    var obj = function(req, res) {
        this._req = req;
        this._res = res;

        this._parser = {
            'application/x-www-form-urlencoded': form,
            'application/json': json,
            'multipart/form-data': multipart
        }
    };

    obj.prototype = $.extends('!base', {
        get: function() {
            if ($.is.got(this._req.method, ['POST', 'PUT', 'DELETE'])) {
                var type = (this._req.headers['content-type'] || '').split(';')[0];
                
                if ($.defined(this._parser[type])) {
                    var a = new this._parser[type](this._req, this._res);
                    return (a.get());
                }
            }

            return ($.promise().resolve({}));
        }
    });

    module.exports = obj;
});