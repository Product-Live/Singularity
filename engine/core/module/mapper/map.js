"use strict";

$.require([
    'core!/module/mapper/scope.js',
    'core!/module/mapper/path.js'
], function(
    scope,
    path
) {

    var obj = function(name, config, mapper, called, configFile) {
        this._name = name;
        this._config = config;
        this._mapper = mapper;
        this._called = called;
        this._pathLoaded = {};
        this._configFile = configFile || {};
        this._loaded = {};

        this._customGlobal = (new scope(this._name, this._mapper, this._config)).getScope();
    };

    obj.prototype = $.extends('!base', {
        /**
         * Get object with all the info about the object found the module
         *
         * @param obj
         * @returns {{key: string, scope: *, isStatic: boolean, isPrivate: boolean}}
         */
        getObjScope: function(obj) {
            for (var i in obj) {
                var key = i, scope = i.split(' ');
                break;
            }
            for (var i in scope) {
                scope[i] = scope[i].toLowerCase();
            }

            return ({
                key: key,
                scope: scope[1] || scope[0],
                isStatic: (scope[0] == 'static'),
                isPrivate: ((scope[1] || scope[0]) == 'private')
            });
        },

        /**
         * Get path inside module
         *
         * @param sub
         * @returns {*}
         */
        path: function(sub) {
            return ($.file.path.normalize(path.get(this._name)+ '/' + sub));
        },

        /**
         * Load file for a module
         *
         * @param path
         * @param file
         * @param l
         * @returns {*}
         */
        loadFile: function(path, file, l) {
            path = $.path((path[0] != '/')? path : path.substring(1));
            var self = this, loaded = l; // get loaded file path in object

            if (!$.defined(loaded)) {
                var p = path.split('/'), loaded = this._loaded;
                for (var i in p) {
                    if (!$.defined(loaded[p[i]])) {
                        loaded[p[i]] = {};
                    }
                    loaded = loaded[p[i]];
                }
            }

            var full = path + '/' + file, cdn = false;
            for (var i in this._config.cdn) {
                (function(f, d) {
                    if (f.match(new RegExp('^/*' + d.source))) {
                        let isAbsolute = f.match(new RegExp('^/*' + d.source + '$'));
                        self._mapper._cdn.push({
                            path: $.file.path.normalize(isAbsolute? d.path : (d.path + f.replace(new RegExp('^/*' + d.source), ''))),
                            source: self.path(full),
                            priority: d.priority
                        });
                        cdn = true;
                    }
                })('/' + full, this._config.cdn[i]);
            }
            if (cdn) {
                //console.log('is cdn', full);
                return (null);
            }
            
            for (var i in this._config.ignore) {
                if (('/' + full).match(new RegExp('^' + this._config.ignore[i] + '$'))) {
                    console.log(full, 'is ignored match', this._config.ignore[i]);
                    return (null);
                }
            }

            if (this._configFile['/' + full] || this._configFile[full] || !file.match(/.*(\.js|\.json)/)) {
                return (null); // skip loading for the config files
            }

            if (!$.defined(loaded[file])) {
                var p = this.path(full), tmp = $.require(p);
                if (!$.is.function(tmp)) {
                    throw new Error('expected a function back in module file. ' + p);
                }
                tmp = tmp(this._customGlobal);

                if (!$.is.object(tmp)) {
                    throw new Error('missing scope for object in ' + full);
                }

                var scope = this.getObjScope(tmp);
                loaded[file] = {
                    scope: scope.scope,
                    value: (scope.isStatic)? new tmp[scope.key]() : tmp[scope.key]
                };

                return (loaded[file]);
            } else {
                return (loaded[file]);
            }
        },

        /**
         * Go back to loading more folder or load the files into the map
         *
         * @param path
         * @param file
         * @param loaded
         * @param dep
         * @returns {*|Promise|obj}
         */
        loadSub: function(path, file, loaded, dep) {
            var self = this, full = path + '/' + file;
            if (file.match(/^\..*/)) {
                return ($.promise().resolve());
            }

            return ($.file.stat(this.path(full)).then(function(stats) {
                if (stats.isDirectory()) {
                    if (!$.defined(loaded[file])) {
                        loaded[file] = {};
                    }
                    return (self.load(full, loaded[file], dep + 1));
                } else {
                    if (dep > 1) {
                        self.loadFile(path, file, loaded);
                    }
                    return ($.promise().resolve());
                }
            }));
        },

        /**
         * Start the recursive loading of all file for a module
         *
         * @param p
         * @param l
         * @param d
         * @returns {*|Promise|obj}
         */
        load: function(p, l, d) {
            var self = this, path = p || '', loaded = l || this._loaded, dep = d || 0;

            return ($.file.list(this.path(path)).then(function(files) {
                var wait = [];
                for (var i in files) {
                    wait.push(self.loadSub(path, files[i], loaded, dep + 1));
                }
                return ($.all(wait));
            }));
        }
    });

    module.exports = obj;
});