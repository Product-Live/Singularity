"use strict";

$.require([
    //
], function(
    //
) {

    var obj = function(data) {
        this._meta = $.schema.merge({
            status: 200,
            type: 'json',
            header: {},
            data: {}
        }, data);

    };
    obj.prototype = {
        status: function(code) {
            this._meta.status = code;
            return (this);
        },

        data: function(obj) {
            this._meta.data = obj;
            return (this);
        },

        type: function(obj) {
            this._meta.type = obj;
            return (this);
        },

        header: function(obj, force) {
            this._meta.header = (force) ? obj : $.schema.merge(this._meta.header, obj);
            return (this);
        },
        
        meta: function() {
            return (this._meta);
        }
    };

    module.exports = obj;
});