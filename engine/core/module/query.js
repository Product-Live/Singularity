"use strict";

$.require([
    //
], function(
    //
) {

    var obj = function(core, param) {
        this._core = core;
        this._param = param || {};

        this._website = null;
        this._api = 'http';
        this._method = 'post';
        this._route = null;

        this._map = core._mapper._map;
        this._order = ['api', 'method'];
    };

    obj.prototype = $.extends('!base', {
        /**
         * Resolve the controller object in the mappers loaded module. validated its a correct action and run it
         *
         * @param route
         * @param param
         * @returns {*}
         * @private
         */
        _execute: function(route, param) {
            var controller = this._core._mapper._getImport(route.module, '/controller/' + route.action.controller + '.js', route.module);
            if ($.is.object(controller) && $.is.function(controller[route.action.method])) {
                var subParam = {}, part = (route.path).replace(/\\/g, '').split('/'), oPart = this._route.split('/');
                for (var i in part) {
                    if (part[i][0] == ':') {
                        subParam[part[i].substring(1)] = oPart[i];
                    }
                }
                var tmp = controller[route.action.method]($.schema.merge().deep(param, {body: subParam}));
                if ($.is.instance(tmp, $.promise) || tmp instanceof Promise) {
                    return (tmp);
                } else {
                    return ($.promise().resolve(tmp));
                }
            }
            return ($.promise().reject(new Error('missing method on controller' + $.json.encode(route))));
        },

        /**
         * Match to a route object in the mappers map
         *
         * @param map
         * @param param
         * @param i
         * @returns {*}
         * @private
         */
        _hasRoute: function(map, param, i) {
            i = i || 0;
            if (($.defined(map) && $.defined(this._order[i])) || $.is.array(map)) {
                if ($.is.array(map)) {
                    var found = [], priority = 0;
                    for (var i in map) {
                        if (this._route.match(new RegExp(map[i].pathReg))) {
                            if (map[i].priority > priority) {
                                priority = map[i].priority;
                                found = [map[i]];
                            } else {
                                if (map[i].priority == priority) {
                                    found.push(map[i]);
                                }
                            }
                        }
                    }
                    if (found.length > 0) {
                        if (found.length == 1) {
                            if (this._param.info) {
                                return ($.promise().resolve(found[0]));
                            } else {
                                return (this._execute(found[0], param));
                            }
                        } else {
                            return ($.promise().reject(new Error('match more then one route "' + $.json.encode(found) + '".')));
                        }
                    }
                    //console.log('No routes matched', this._route);
                    //console.log($.color.red("No routes matched.", this._route));
                    return ($.promise().reject(new Error('no routes matched.')));
                } else {
                    return (this._hasRoute(map[this['_' + this._order[i]]], param, i + 1));
                }
            } else {
                return ($.promise().reject(new Error('ran out of map to search.')));
            }
        },

        /**
         * Set what website this is for
         *
         * @param a
         * @returns {obj}
         */
        origin: function(a) {
            this._website = a || null;
            return (this);
        },

        /**
         * Set to execute or return info on the map
         *
         * @param a
         * @returns {obj}
         */
        info: function(a) {
            this._param.info = a || false;
            return (this);
        },

        /**
         * Set what api it's coming from
         * @param a
         * @returns {obj}
         */
        api: function(a) {
            this._api = a || 'http';
            return (this);
        },

        /**
         * What method (post, get, etc) don't know how this will work for sockets
         *
         * @param a
         * @returns {obj}
         */
        method: function(a) {
            this._method = (a || 'post').toLowerCase();
            return (this);
        },

        /**
         * The route to match in the map
         *
         * @param a
         * @returns {obj}
         */
        route: function(a) {
            this._route = a || null;
            return (this);
        },

        /**
         * Run a search in the map
         *
         * @returns {*}
         */
        run: function(p) {
            var self = this, param = p || {};
            if ($.defined(this._route)) {
                if ($.is.string(this._website)) {
                    var found = [];
                    for (var i in this._map.website) {
                        if (($.defined(this._map.regex[i]) && this._website.match(this._map.regex[i])) || this._website == i) {
                            found.push(i);
                        }
                    }
                    if (found.length > 0) {
                        var func = function(i) { // look for route in all websites match (this maybe be a error to do so)
                            return (self._hasRoute(self._map.website[found[i]], param).then(function (res) {
                                return (res);
                            }, function () {
                                if (!$.defined(found[i])) {
                                    return (self._hasRoute(self._map.default, param));
                                } else {
                                    return (func(i + 1));
                                }
                            }));
                        };
                        return (func(0));
                    }
                    return (this._hasRoute(this._map.default, param));
                } else {
                    return (this._hasRoute(this._map.default, param));
                }
            } else {
                return ($.promise().reject(new Error('missing route.')));
            }
        }
    });

    module.exports = obj;
});