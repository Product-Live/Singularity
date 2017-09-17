"use strict";

$.require([
    //
], function(
    //
) {

    var obj = function(name, func) {
        this._callback = func;
        this._name = name;
    };

    obj.prototype = $.extends('!base', {
        /**
         * Match the origin for a request
         *
         * @param origin
         * @param req
         * @returns {boolean}
         * @private
         */
        _origin: function(origin, req) { // TODO: add regex support for a origin
            return (origin === '0.0.0.0' || origin == req.headers.host);
        },

        /**
         * Match regex on url path
         *
         * @param reg
         * @param req
         * @returns {boolean|Array|{index: number, input: string}}
         * @private
         */
        _regRxp: function(reg, req) {
            return (!$.defined(reg) || req.url.match(new RegExp(reg)));
        },

        /**
         * Get the the callback for partition
         * 
         * @returns {*|null|Array}
         */
        func: function () {
            return (this._callback);
        },

        /**
         * Run the match on origin and reg
         *
         * @param req
         * @param res
         * @param scope
         * @returns {boolean}
         */
        run: function(req, res, scope) {
            if ($.is.function(this._callback)) {
                var match = $.config.get('server.http.partition.' + this._name);

                if ($.is.array(match)) {
                    for (var i in match) {
                        for (var x in match[i].origin) {
                            if (this._origin(match[i].origin[x], req) && this._regRxp(match[i].pathReg, req)) {
                                return ({
                                    url: req.url.replace(new RegExp(match[i].pathReg), ''),
                                    path: match[i].localPath
                                });
                            }
                        }
                    }
                }
            }
            return (false);
        }
    });

    module.exports = obj;
});