"use strict";

$.require([
    'core!/module/mapper/map.js',
    'core!/module/mapper/route.js',
    'core!/module/mapper/path.js',

    'core!/module/model/route.js',
    'core!/module/model/import.js',
    'core!/module/model/cdn.js'
], function(
    map,
    route,
    path,

    modelRoute,
    modelImport,
    modelCdn
) {

    var obj = function() {
        this._module = {}; // hash map of Map object
        this._routes = {};
        this._cdn = [];
        this._map = {
            default: {},
            website: {}
        };
        this._configFile = {};
        this._sericeManager = null;
    };
    obj.prototype = $.extends('!base', {
        _modelType: {
            import:  modelImport.create(),
            route: modelRoute.create(),
            cdn: modelCdn.create()
        },

        /**
         * Load a imported file from a other module check with it's private and force file load
         *
         * @param module
         * @param path
         * @param from
         * @returns {*}
         * @private
         */
        _getImport: function(module, path, from) {
            if ($.defined(this._module[module])) {
                var p = ((path[0] != '/')? path : path.substring(1)).split('/'), obj = this._module[module]._loaded;
                for (var i in p) {
                    if ($.defined(obj[p[i]])) {
                        obj = obj[p[i]];
                    } else {
                        var p = path.split('/'), file = p.splice(-1, 1)[0]; // the split before join
                        obj = this._module[module].loadFile(p.join('/'), file, null);
                        break;
                    }
                }

                if (!$.defined(obj)) {
                    throw new Error('failed to load path "' + path + '" from module "' + module + '".');
                }

                if ((obj.scope != 'private' || $.config.get('module.skipPrivate')) || module == from) {
                    return (obj.value);
                } else {
                    throw new Error('object in module "' + module + '" is private and can\'t be used from "' + module + '".');
                }
            } else {
                throw new Error('module "' + module + '" is not loaded.');
            }
        },

        /**
         * Validate a model with it's correct type used in the loading of configs
         *
         * @param type
         * @param data
         * @private
         */
        _validModel: function(type, data) {
            if ($.defined(this._modelType[type])) {
                if (this._modelType[type].is(data)) {
                    var v = data.valid();
                    return (v.is() ? true : v.error());
                }
                return (false);
            }
            return (null);
        },

        _createModel : function(type, data) {
            var m = this._modelType[type];
            if (m) {
                return (m.is(data)? data : m.create().set(data));
            }
            return (data);
        },

        /**
         * Load config for a module and validate the types
         *
         * @param name
         * @private
         */
        _loadConfig: function(name) {
            var basePath = path.get(name);
            var type = $.require(basePath + '/config.js');
            
            if ($.is.function(type)) {
                type = type(modelRoute, modelImport, modelCdn);
            }

            if ($.is.object(type)) {
                var out = {ignore: [], dependencies: {}, route: [], import: [], cdn: []}, tmp = {};

                for (var i in out) {
                    var x = 0;
                    if ($.defined(type[i])) {
                        while (type[i][x]) {
                            if ($.is.string(type[i][x]) && i != 'ignore') {
                                if (!$.defined(tmp[i])) {
                                    tmp[i] = $.is.array(out[i]) ? [] : {};
                                }
                                (($.is.object(this._configFile[name])) ? this._configFile[name] : (this._configFile[name] = {}))[type[i][x]] = true;
                                var load = $.require(basePath + '/' + type[i][x]);
                                if ($.is.function(load)) {
                                    load = load(modelRoute, modelImport, modelCdn);
                                }
                                if ($.is.array(out[i])) {
                                    tmp[i] = $.schema.merge().array(tmp[i], load);
                                } else {
                                    tmp[i] = $.schema.merge(tmp[i], load);
                                }
                                type[i].splice(x, 1);
                            } else {
                                x += 1;
                            }
                        }
                    }
                }
                type = $.schema.merge().array(type, tmp);

                for (var i in out) {
                    for (var x in type[i]) {
                        type[i][x] = this._createModel(i, type[i][x]);

                        let v = this._validModel(i, type[i][x]);
                        if (v === true || v === null) {
                            if ($.is.array(out[i])) {
                                out[i].push((v)? type[i][x].get() : type[i][x]);
                            } else {
                                out[i][x] = (v)? type[i][x].get() : type[i][x];
                            }
                        } else {
                            throw new Error(
                                'expected to receive a model in config of module "' + name +
                                '" model report "' + $.json.encode(v) + '".'
                            );
                        }
                    }
                }

                return (out);
            }
            throw new Error('config for module "' + name + '" is wrong type.');
        },

        addServiceManager: function(obj) {
            this._sericeManager = obj;
        },

        /**
         * Load up all dependency for a module and check for circular imports then creates a object Map for that module
         *
         * @param name
         * @param called
         * @param loadRoute
         * @returns {*}
         */
        map: function(name, called, loadRoute) {
            var self = this, conf = this._loadConfig(name);

            if (this._module[name]) {
                if (loadRoute && !$.defined(self._routes[name])) { // skip the loading of route for dependency
                    self._routes[name] = true;
                    (new route(self, name, conf)).merge();
                }
                return ($.promise().resolve(this._module[name]));
            }

            var load = function(i) {
                if ($.defined(conf.import[i])) {
                    if ($.is.got(conf.import[i].module, called)) {
                        throw new Error('circular import ' + conf.import[i].module + ' ' + $.json.encode(called));
                    }

                    var c = $.schema.copy(called);
                    return (self.map(conf.import[i].module, (c.push(name), c), false).then(function() {
                        return (load(i + 1));
                    }));
                } else {
                    return ($.promise().resolve());
                }
            };

            return (load(0).then(function() {
                self._module[name] = new map(name, conf, self, called, self._configFile[name]);
                if (loadRoute && !$.defined(self._routes[name])) { // skip the loading of route for dependency
                    self._routes[name] = true;
                    (new route(self, name, conf)).merge();
                }
                return (self._module[name].load());
            }));
        },

        /**
         * Start the loading of all module given in the array
         *
         * @param modules
         */
        load: function(modules) {
            var self = this, next = function(i) {
                if ($.defined(modules[i])) {
                    return (self.map(modules[i], [], true).then(function() {
                        return (next(i + 1));
                    }));
                } else {
                    return ($.promise().resolve());
                }
            };
            return (path.load().then(function() {
                return (next(0));
            }));
        }
    });

    module.exports = obj;
});