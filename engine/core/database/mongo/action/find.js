"use strict";

var obj = function(core, find, field) {
    this._core = core;
    var db = this._core.DB();
    if (db) {
        this._obj = db.find(find, field);
        this.valid = true;
    } else {
        this.valid = false;
    }
};
obj.prototype = {
    /**
     * add a sort
     *
     * @param param
     * @returns {obj}
     */
    sort: function(param) {
        this._obj.sort(param);
        return (this);
    },

    /**
     * set the amount of row to return
     *
     * @param param
     * @returns {obj}
     */
    limit: function(param) {
        this._obj.limit(param);
        return (this);
    },

    /**
     * Skip x rows
     *
     * @param param
     * @returns {obj}
     */
    skip: function(param) {
        this._obj.skip(param);
        return (this);
    },

    /**
     * Run and get response as array
     * @returns {*}
     */
    toArray: function() {
        var p = new $.promise();

        this._obj.toArray(function(err, result) {
            if (err) {
                p.reject(err);
            } else {
                p.resolve(result);
            }
        });

        return (p);
    },

    /**
     * alias
     * @returns {*}
     */
    execute: function() {
        return (this.toArray());
    },

    /**
     * alias
     * @returns {*}
     */
    exec: function() {
        return (this.toArray());
    },

    /**
     * alias
     * @returns {*}
     */
    run: function() {
        return (this.toArray());
    }
};

module.exports = obj;