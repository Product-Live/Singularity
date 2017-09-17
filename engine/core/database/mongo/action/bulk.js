"use strict";

var bulk = function(core, param, order) {
    this._core = core;
    if (order === false) {
        this._bulk = this._core.DB().initializeUnorderedBulkOp(param);
    } else {
        this._bulk = this._core.DB().initializeOrderedBulkOp(param);
    }
};
bulk.prototype = {
    /**
     * add find operation
     *
     * @param query
     * @returns {*|FindOperatorsOrdered|Cursor|FindOperatorsUnordered}
     */
    find: function(query) {
        return (this._bulk.find(query));
    },

    insert: function(query) {
        return (this._bulk.insert(query));
    },

    /**
     * run the operation group
     *
     * @param param
     * @returns {*}
     */
    execute: function(param) {
        var p = new $.promise();

        this._bulk.execute(param || {}, function(err, res) {
            if (!err) {
                p.resolve(res);
            } else {
                p.reject(err);
            }
        });

        return (p);
    }
};

module.exports = bulk;