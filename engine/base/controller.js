"use strict";

$.require([
    'base!controller/file.js',
    'base!controller/response.js'
], function(
    file,
    response
) {

    var obj = function () {};
    obj.prototype = $.extends('!base', {
        isFile: function (obj) {
            return ($.defined(obj) && $.is.object(obj) && $.is.function(obj.isFile) && obj.isFile());
        },
        
        file: function(obj) {
            return (new file(obj));
        },

        res: function(data) {
            return (new response(data));
        }
    });
    module.exports = obj;
});