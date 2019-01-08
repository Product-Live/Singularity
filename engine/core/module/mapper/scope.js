"use strict";

$.require([
    'core!/module/mapper/path.js'
], function(
    path
) {

    var obj = function(name, mapper, config) {
        this._name = name;
        this._mapper = mapper;
        this._config = config;

        this._scope = {};
        var self = this, overwrite = {
            require: function(path, callback) {
                return (self._require(path, callback));
            },
            service: function(name) {
                return (self._service(name));
            },
            path: function(path) {
                return (self._path(path));
            },
            cog: function() {
                return ($.cog(self._scope));
            },
            extends: function(a, b) {
                return (self._extends(a, b));
            }
        };
        for (var i in $) {
            if (!$.defined(overwrite[i])) {
                this._scope[i] = $[i];
            }
        }
        for (var i in overwrite) {
            this._scope[i] = overwrite[i];
        }
    };

    obj.prototype = $.extends('!base', {
        /**
         * Find the absolute path for a imported object
         *
         * @param path
         * @returns {*}
         */
        _importPath: function(path) {
            var imp = this._config.import;
            for (var i in imp) {
                if (($.defined(imp[i].as) && imp[i].as == path) || (!$.defined(imp[i].as) && imp[i].path == path)) {
                    return (imp[i]);
                }
            }
            return (null);
        },

        _path: function(p) {
            var prefix = p.split('!');
            if (prefix[0] == 'module' || prefix[0] == 'import') {
                if (prefix[0] == 'module') {
                    return ($.path(path.get(this._name) + '/' + prefix[1]));
                } else {
                    throw new Error('$.path does not support import as you can\'t import content files.');
                }
            } else {
                return ($.path(p));
            }
        },

        /**
         * Custom require to be used in a module
         *
         * @param path
         * @param callback
         * @returns {*}
         * @private
         */
        _require: function(path, callback) {
            if ($.defined(path)) {
                var list = ((!$.is.array(path)) ? [path] : path);

                var out = {}, give = [];
                for (var i in list) {
                    var prefix = list[i].split('!');
                    if (prefix[0] == 'module' || prefix[0] == 'import') {
                        if (prefix[0] == 'module') {
                            out[i] = this._mapper._getImport(this._name, prefix[1], this._name);
                        } else {
                            var imp = this._importPath(prefix[1]);
                            if ($.defined(imp)) {
                                out[i] = this._mapper._getImport(imp.module, imp.path, this._name);
                            } else {
                                throw new Error('no import found for "' + prefix[1] + '" import from module ' + this._name);
                            }
                        }
                    } else {
                        give.push(list[i]);
                    }
                }

                if ($.is.function(callback)) {
                    return ($.require(give, function() {
                        var merge = [];
                        for (var i in arguments) {
                            merge.push(arguments[i]);
                        }
                        for (var i in out) {
                            merge.splice(i, 0, out[i]);
                        }
                        return (callback.apply(callback, merge));
                    }));
                } else {
                    var tmp = $.require(give);
                    for (var i in out) {
                        tmp.splice(i, 0, out[i]);
                    }
                    return (tmp);
                }
            }
            return ($.require());
        },

        _service: function(name) {
            var manager = this._mapper._sericeManager;
            if ($.defined(manager)) {
                var scope = manager.scope(this._name);
                if ($.defined(scope)) {
                    return (scope.service(name));
                } else {
                    throw new Error('the service manager has no scope created for the module "' + this._name + '".');
                }
            }
            return (null);
        },
        //TODO strings dont merge the prototype look into the scope require
        _extends: function(a, b) {
            if (!$.is.string(a) && !$.is.function(a)) {
                throw new Error('$.extend requires a object or string to work.');
            }
            return ($.extends(($.is.string(a) && a[0] != '!') ? this._require(a) : a, b));
        },

        /**
         * Get Scope that has been initialized for a module
         *
         * @returns {{}|*}
         */
        getScope: function() {
            return (this._scope);
        }
    });

    module.exports = obj;
});