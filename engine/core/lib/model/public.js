"use strict";

var obj = function(core, valid) {
	this._core = core;
	this._map = core.map;
	this._sData = core._copy();
	this._valid = valid;
    this._oData = {};
};
obj.prototype = {
    /**
     * Set the data by passing into formater
     * @param data
     * @returns {obj}
     */
	set: function(data) {
		this._sData = this._core._merge(this._sData, data);
        for (var i in data) {
            if ($.defined(this._sData[i])) {
                this._oData[i] = this._sData[i];
            }
        }
		return (this);
	},

    /**
     * Get data formatted into the model
     * @param o
     * @returns {*|Promise}
     */
	get: function(o) {
        var options = o || {};
		return (this._core._get((options.changes) ? this._oData : this._sData, options));
	},

    /**
     * Is this model valid
     *
     * @returns {*|boolean}
     */
	valid: function() {
		return (new this._valid(this._map, this._sData));
	},

    /**
     * Get collection for model
     *
     * @returns {*}
     */
	collection: function() {
		return (this._map._collection);
	},

    /**
     * Get model name
     *
     * @returns {string|null|*|string}
     */
	name: function() {
		return (this._map._name);
	},

    /**
     * Is the object given this specific model
     * @param a
     * @returns {*|boolean}
     */
    is: function(a) {
        return ($.is.instance(a, obj) && a.name() == this.name());
    },

    /**
     * Create new model to be used
     *
     * @returns {*|Object|MongoError|Promise}
     */
	create: function() {
		return (this._core.create());
	},

    /**
     * Get data as string
     *
     * @returns {*}
     */
	toString: function() {
		return ($.json.encode(this._sData));
	}
};

module.exports = obj;
