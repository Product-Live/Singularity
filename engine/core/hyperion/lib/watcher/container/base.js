"use strict";

$.require([
    'hyperion!/lib/watcher/container/command.js',
    'core!bash.js'
], function(
    command,
    bash
) {

    var obj = function(core) {};
    obj.prototype = $.extends('hyperion!/lib/docker/base.js', {
        /**
         * Get the container data from the map
         *
         * @returns {*}
         * @private
         */
        _container: function() {
            for (var i in this._core._config.map.container) {
                if (this._core._config.map.container[i].key == this._id) {
                    this._configBackup = this._core._config.map.container[i];
                    return (this._core._config.map.container[i]);
                }
            }
            if (!$.defined(this._configBackup)) {
                throw new Error('container is missing map to work off.');
            }
            return (this._configBackup);
        },

        /**
         * Merge data into the containers map in the watchers memory
         *
         * @param data
         * @private
         */
        _containerUpdate: function(data) {
            for (var i in this._core._config.map.container) {
                if (this._core._config.map.container[i].key == this._id) {
                    this._core._config.map.container[i] = $.schema.merge().deep(this._core._config.map.container[i], data);
                    break;
                }
            }
        },

        /**
         * Create map container name to container driver object
         *
         * @returns {{}}
         * @private
         */
        _containerMap: function() {
            var map = {};

            for (var i in this._core._config.map.container) {
                map[this._core._config.map.container[i].key] = this._core._container[this._core._config.map.container[i].key];
            }

            return (map);
        },

        /**
         * Get the containers image to use
         *
         * @returns {string}
         * @private
         */
        _getImage: function () {
            var cont = this._container();
            return (cont.image + ':' + cont.version);
        },

        /**
         * Create the run command
         *
         *  Note: the // is not a error this is needed on windows so docker can convert it to unix path
         *      MSYS_NO_PATHCONV: 1 got added into env that stops this conversion (they where at //- before '//' to '/')
         *
         * @returns {string}
         */
        _runCommand: function() {
            var tmp = new command(this._container());
            return (tmp.get());
        },

        /**
         * Get the hash for the run command
         *
         * @returns {string}
         */
        _runCommandHash: function() {
            var tmp = new command(this._container());
            return (tmp.getHash());
        },

        /**
         * Run a new docker container
         *
         * @param env
         * @returns {*}
         * @private
         */
        _create: function(env) {
            this._currentRun = this._runCommand();
            console.log('-- creating container with name', this._container().key, 'command', this._currentRun);
            this._containerUpdate({status: 'starting'});
            return (bash.run(this._currentRun, env));
        },

        /**
         * Get container Name used in docker
         *
         * @returns {*}
         */
        name: function() {
            return (this._container().key);
        },

        /**
         * Get container ID in map
         *
         * @returns {*}
         */
        id: function() {
            return (this._id);
        },

        /**
         * Is the container missing in map?
         *
         * @returns {boolean}
         */
        isDead: function() {
            for (var i in this._core._config.map.container) {
                if (this._core._config.map.container[i].key == this._id) {
                    return (false);
                }
            }
            return (true);
        },

        map: function() {
            return (this._container());
        }
    });

    module.exports = obj;
});