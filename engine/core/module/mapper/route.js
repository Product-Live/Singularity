"use strict";

$.require([
    //
], function(
   //
) {

    var obj = function(core, module, config) {
        this._core = core;
        this._module = module;
        this._config = config;

        this._tmp = {
            regex: {},
            default: {},
            website: {}
        };
    };

    obj.prototype = $.extends('!base', {
        /**
         * force array to be given
         *
         * @param a
         * @returns {*}
         */
        array: function(a) {
            return ($.is.array(a)) ? a : [a];
        },

        /**
         * Create a standard object for a route to be added into the map
         *
         * @param route
         * @returns {{module: *, pathReg: string, path: (*|obj.path|Function|string|string), param: (*|param|{id}), action: (*|action|{controller, method}|string)}}
         */
        pathObject: function(route) {
            var path = ($.is.instance(route.path, RegExp)) ? route.path.toString() : route.path;
            if ($.is.instance(route.path, RegExp)) {
                path = path.substring(1, path.length - 1);
            }

            var reg = (path + ((path[path.length - 1] == '/') ? '{0,1}' : '\/{0,1}')).replace(/\\*\//g, '\\\/');
            for (var i in route.param) {
                reg = reg.replace(':' + i, route.param[i]);
            }
            return ({
                module: this._module,
                pathReg: '^' + reg + '$',
                priority: route.priority,
                path: route.path,
                param: route.param,
                action: route.action
            });
        },

        /**
         * Add with the order of the chain forking off to hit all option given in the config
         *
         * @param chain
         * @param location
         * @param route
         */
        addChain: function(chain, location, route) {
            var key = chain.splice(0, 1), add = this.array(route[key]);

            for (var i in add) {
                if (!$.defined(location[add[i]])) {
                    location[add[i]] = {};
                }

                if (chain.length != 0) {
                    if (chain[0] == 'path') {
                        if (!$.is.array(location[add[i]])) {
                            location[add[i]] = [];
                        }
                        location[add[i]].push(this.pathObject(route));
                    } else {
                        this.addChain($.schema.copy(chain), location[add[i]], route);
                    }
                }
            }
        },

        /**
         * Start adding the route by chain to the map to all the given website. NULL is global website the fallback
         *
         * @param route
         */
        add: function(route) {
            var website = this.array(route.website);
            for (var i in website) {
                if ($.defined(website[i])) {
                    var key = ($.is.object(website[i])) ? website[i].toString() :  website[i];
                    if ($.is.object(website[i]) && website[i].type == 'regex') {
                        this._tmp.regex[key] = new RegExp(website[i].regex);
                    }

                    if (!$.defined(this._tmp.website[key])) {
                        this._tmp.website[key] = {}
                    }
                    this.addChain(['api', 'method', 'path'], this._tmp.website[key], route);
                } else {
                    this.addChain(['api', 'method', 'path'], this._tmp.default, route);
                }
            }
        },

        _mergeRoute: function(a, b) {
            if ($.defined(b)) {
                for (var i in b) {
                    if ($.is.object(a[i]) && $.is.object(b[i])) {
                        if ($.is.array(a[i]) && $.is.array(b[i])) {
                            for (var x in b[i]) {
                                a[i].push(b[i][x]);
                            }
                        } else {
                            a[i] = this._mergeRoute(a[i], b[i]);
                        }
                    } else {
                        a[i] = b[i];
                    }
                }
            }
            return (a);
        },

        /**
         * Start adding onto the tmp map and merge that map info the core version
         */
        merge: function() {
            var route = this._config.route;
            for (var i in route) {
                this.add(route[i]);
            }
            this._core._map = this._mergeRoute(this._core._map, this._tmp);
        }
    });

    module.exports = obj;
});