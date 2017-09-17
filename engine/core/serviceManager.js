"use strict";

$.require([
    //
], function(
    //
) {

    var obj = function(core) {
        this._core = core;
        /*this._name = name;

         this._whiteList = {};
         this._service = {};
         this._partition = {};*/
    };
    obj.prototype = $.extends('!base', {
        /**
         * Merge white list controlling wha&t is available for Service function
         *
         * @param list
         * @param value
         * @returns {obj}
         * @private
         */
        _mergeWhiteList: function(list, value) {
            var service = ($.is.array(list)) ? list : [list];

            if (!$.is.object(this._whiteList)) {
                this._whiteList = {};
            }

            for (var i in service) {
                if ($.is.string(service[i])) {
                    this._whiteList[service[i]] = value;
                }
            }
            return (this);
        },

        /**
         * Add service to the list
         *
         * @param name
         * @param obj
         * @returns {obj}
         */
        add: function(name, obj) {
            if (!$.is.object(this._service)) {
                this._service = {};
            }
            if ($.is.object(name)) {
                for (var i in name) {
                    this._service[i] = name[i];
                }
            } else {
                this._service[name] = obj;
            }
            return (this);
        },

        /**
         * White list that you can get parent the scopes to get a object
         *
         * @param list
         * @returns {*|obj}
         */
        import: function(list) {
            return (this._mergeWhiteList(list, true));
        },

        /**
         * Drop them from the white list so they can't get for parent scope
         *
         * @param list
         * @returns {*|obj}
         */
        drop: function(list) {
            return (this._mergeWhiteList(list, true));
        },

        /**
         * Get Service from current scope or will try moving up the chain
         *
         * @param name
         * @returns {*}
         */
        service: function(name) {
            if ($.defined(this._whiteList) && $.defined(this._whiteList[name]) && this._whiteList[name] && $.defined(this._core)) {
                var tmp = this._core.service(name);
                if ($.defined(tmp)) {
                    return (tmp);
                }
            }
            if ($.is.object(this._service)) {
                return (this._service[name]);
            }
            return (null);
        },

        /**
         * Get the parent Scope from the current
         *
         * @returns {*}
         */
        parentScope: function() {
            return (this._core);
        },

        /**
         * Get the root Scope
         *
         * @returns {*}
         */
        rootScope: function() {
            var current = this._core;
            while ($.defined(current._core)) {
                current = current._core;
            }
            return (current);
        },

        /**
         * Get scope with name or address up the chain
         *
         * @param p
         * @returns {*}
         */
        scope: function(p) {
            if ($.is.object(this._partition)) {
                var path = p.split(/\.+/);

                var current = this._partition[path.splice(0, 1)];
                for (var i in path) {
                    if (!$.defined(current)) {
                        return (current);
                    } else {
                        current = current.scope(path[i]);
                    }
                }
                return (current);
            }
            return (null);
        },

        /**
         * Create a new isolated scope
         * @param name
         * @returns {obj}
         */
        createScope: function(name) {
            if (!$.is.object(this._partition)) {
                this._partition = {};
            }
            return (this._partition[name] = new obj(this));
        }
    });

    module.exports = obj;
});