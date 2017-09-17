"use strict";

$.require([
    'core!/server/http/native/wrapper/callback/content.js'
], function(
    content
) {

    var obj = function(core, res, req) {
        this._core = core;
        this._res = res;
        this._req = req;
    };

    obj.prototype = $.extends('!base', {
        /**
         * Load File from public directory that is defined in the config
         * 
         * @param path
         * @returns {*}
         */
        loadFile: function(path) {
            var self = this;
            return ($.file.stat(path).then(function(stats) {
                if (stats.isFile()) {
                    return (new content(self._res, self._req, {
                        stats: stats,
                        path: path
                    }));
                } else {
                    return ($.promise().reject('is a folder'));
                }
            }, function(e) {
                return ($.promise().reject(e));
            }));
        }
    });

    module.exports = obj;
});