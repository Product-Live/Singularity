"use strict";

$.require([
    'core!git'
], function(
    git
) {

    var obj = function(config) {
        this._repo = {
            module: { // add more
                basic: 'https://github.com/anzerr/Skeleton_Module.git',
                plain: 'https://github.com/anzerr/Skeleton_Module.git',
                example: 'https://github.com/anzerr/Skeleton_Module.git',
                client: 'https://github.com/anzerr/Skeleton_Module_Client.git'
            },
            app: 'https://github.com/anzerr/Skeleton_App.git'
        };
        this._config = config;
    };
    obj.prototype = $.extends('!base', {
        app: function() {
            const p = appRoot.absolute, g = new git(this._repo.app, {
                name: 'app',
                path: p
            });
            return ($.file.stat(p + '/app').then(function() {
                throw new Error('app already exist can\'t create skeleton.');
            }, function() {
                return (g.clone(true));
            }).then(function() {
                return ($.all([
                    $.file.remove(p + '/app/.git'),
                    $.file.remove(p + '/app/.gitmodules'),
                    $.file.remove(p + '/app/.gitignore'),
                    $.file.create(p + '/app/module/')
                ]));
            }).then(function() {
                return true;
            }, function() {
                return true;
            }));
        },

        module: function() {
            const p = appRoot.absolute + '/app/module/', g = new git(this._repo.module[this._config.module || 'basic'], {
                name: this._config.name,
                path: p
            }), self = this;

            return ($.file.stat(p + this._config.name).then(function() {
                throw new Error('module already exist can\'t create skeleton.');
            }, function() {
                return (g.clone());
            }).then(function() {
                return ($.all([
                    $.file.remove(p + self._config.name + '/README.md'),
                    $.file.remove(p + self._config.name + '/README'),
                    $.file.remove(p + self._config.name + '/LICENSE'),
                    $.file.remove(p + self._config.name + '/LICENSE.md'),
                    $.file.remove(p + self._config.name + '/.gitmodules'),
                    $.file.remove(p + self._config.name + '/.gitignore'),
                    $.file.remove(p + self._config.name + '/.git')
                ]));
            }).then(function() {
                return true;
            }, function() {
                return true;
            }));
        },

        create: function() {
            if (this[this._config.type]) {
                return this[this._config.type]();
            }
            throw new Error('not a valid type for skeleton');
        }
    });

    module.exports = obj;
});
