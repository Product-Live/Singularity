"use strict";

$.require([
    'node!child_process',
    'core!/exit.js',
    'node!cluster'
], function(
    childProcess,
    exit,
    cluster
) {

    /**
     * Fork the application and keep that running if closed
     */
    var obj = function () {
        this._arg = [];
        this._closing = null;

        var self = this;
        if (cluster.isMaster) {
            this._exit = new exit();
            this._exit.on(function () {
                self._closing = new $.promise();
                return (self._closing);
            });
        }
    };
    obj.prototype = $.extends('!base', {
        /**
         * Fork the process with the correct arguments
         *
         * @private
         */
        _fork: function() {
            var self = this;
            this._child = cluster.fork();
            this._child.on('exit', function(worker, code, signal) {
                console.log('--------------- wrapped process closed.');
                if (!$.defined(self._closing)) {
                    self._fork();
                } else {
                    self._closing.resolve();
                }
            });
        },

        /**
         * Start the fork check loop on part of the app
         *
         * @param callback
         * @returns {*}
         */
        run: function(callback) {
            if (cluster.isMaster) {
                this._arg = process.argv || this._arg;
                this._fork();
                return (this);
            }

            return (callback());
        }
    });

    module.exports = obj;
});