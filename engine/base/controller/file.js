"use strict";

$.require([
    //
], function(
    //
) {

    var obj = function (path) {
        this._path = path;
    };
    obj.prototype = {
        setHeader: function(res) {
            var dis = $.defined(this._path.contentDisposition) ? this._path.contentDisposition : 'attachment';
            for (var i in this._path.header) {
                res.set(i, this._path.header[i]);
            }
            res.set('content-disposition', dis + '; filename=\"' + (this._path.name || $.file.path.name(this._path.path)) + '\"');
        },
        
        getPath: function() {
            return (this._path.path);
        }
    };

    module.exports = obj;
});