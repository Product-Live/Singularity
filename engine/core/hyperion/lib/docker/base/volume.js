"use strict";

$.require([
    'hyperion!/lib/docker/format.js'
], function(
    _
) {

    var obj = function() {};
    obj.prototype = $.extends('hyperion!/lib/docker/env.js', {
        /**
         * TODO
         *
         * @returns {*|obj}
         */
        list: function(dangling) {
            var self = this;

            return (this._loadEnv().then(function(e) {
                return (self._bash('docker volume ls -q' + ((dangling) ? 'f dangling=true' : ''), e, true));
            }).then(function(res) {
                if (res.err.length != 0) {
                    $.console.warn('Failed to ls volumes.');
                    return ($.promise().reject());
                }

                return (res);
            }));
        },

        /**
         * TODO
         *
         * @param volume
         * @returns {*|obj|Promise}
         */
        inspect: function(volume) {
            var self = this;

            return (this._loadEnv().then(function(e) {
                return (self._bash('docker volume inspect ' + _.version(volume), e, true));
            }).then(function(res) {
                if (res.err.length != 0) {
                    $.console.warn('Failed to ls volumes.');
                    return ($.promise().reject());
                }

                return (res);
            }));
        },

        /**
         * TODO
         *
         * @param array
         * @returns {*}
         */
        remove: function(array) {
            var self = this;

            return (this._loadEnv().then(function(e) {
                var length = 0, run = function() {
                    var tmp = array.splice(0, 1000);
                    for (var i in tmp) {
                        tmp[i] = _.alpha(tmp[i]);
                    }
                    length += tmp.length;

                    if (tmp.length != 0) {
                        return (self._bash('docker volume rm ' + tmp.join(' '), e, true).then(function() {
                            return (run());
                        }, function() {
                            return ($.promise().resolve(length));
                        }));
                    } else {
                        return ($.promise().resolve(length));
                    }
                };

                return (run());
            }));
        }
    });

    module.exports = obj;
});