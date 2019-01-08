"use strict";

$.require([
    'core!/serviceManager.js',
    'core!/module/mapper.js',
    'core!/module/query.js'
], function(
    serviceManager,
    mapper,
    query
) {

    var obj = function() {
        this._mapper = new mapper();
        this._cdn = null;
    };
    obj.prototype = $.extends('!base', {
        /**
         * Load up module into the application
         *
         * @param param
         * @returns {*|Promise|obj|void}
         */
        load: function(param) {
            if (!$.is.array(param)) {
                throw new Error('can only load with modules with a array');
            }
            return (this._mapper.load(param));
        },

        /**
         * Load plugins into the module system supported for the moment are:
         *  - service manager
         *
         * @param obj
         * @returns {obj}
         */
        loadPlugin: function(obj) {
            var list = ($.is.array(obj)) ? obj : [obj];
            for (var i in list) {
                if ($.is.instance(list[i], serviceManager)) {
                    this._mapper.addServiceManager(obj);
                }
            }

            return (this);
        },

        cdn: function(path) {
            if (!this._cdn) {
                var out = {}, cdn = {}, data = this._mapper._cdn;
                for (var i in data) {
                    if (!cdn[data[i].priority]) {
                        cdn[data[i].priority] = {};
                    }
                    cdn[data[i].priority][data[i].path] = data[i].source;
                }
                for (var i in cdn) {
                    out = $.schema.merge(out, cdn[i]);
                }
                this._cdn = out;
            }
            path = $.file.path.normalize(path);

            return (this._cdn[path]);
        },

        /**
         * Query a route to find loaded route that match
         * 
         * @param param
         * @returns {*}
         */
        query: function(param) {
            return (new query(this, param));
        }
    });

    module.exports = obj;
});