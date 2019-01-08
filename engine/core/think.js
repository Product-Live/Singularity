"use strict";

$.require([
    'node!events'
], function(
    events
) {

    var obj = function(callback, time) {
        this._callback = callback;
        this._time = (($.time.is(time)) ? time.get : time) || $.time.second(1).get;
        this._running = true;
        this._called = false;
        this._stats = { // think of more stats to add onto this?
            called: 0,
            resolve: 0,
            reject: 0
        };
        this._if = {};
        this._event = new events.EventEmitter();
        this._run();
    };
    obj.prototype = $.extends('!base', {
        /**
         * Handle the loop back for _run reduce duplicate code
         *
         * @param type
         * @private
         */
        _reThink: function(type) {
            var self = this;
            this._event.emit('stop');
            this._called = false;

            if ($.is.got(type, ['resolve', 'reject'])) {
                this._stats[type] += 1;
            }

            if (this._running) {
                this._timeout = setTimeout(function () {
                    self._run();
                }, this._time);
            }
        },

        /**
         * Loop to to run the callback on a timeout
         *
         * @returns {null}
         * @private
         */
        _run: function() {
            if (!this._running) {
                return (null);
            }

            this._called = true;
            this._stats.called += 1;
            var self = this, tmp = this._callback(this);
            if ($.is.instance(tmp, $.promise) || tmp instanceof Promise) {
                tmp.then(function() {
                    self._reThink('resolve');
                }, function() {
                    self._reThink('reject');
                });
            } else {
                this._reThink('null');
            }
        },

        /**
         * Stop the loop and return a promise when the current call is done
         *
         * @returns {*}
         */
        stop: function() {
            if (this._running) {
                this._running = false;
                clearTimeout(this._timeout);

                var self = this, p = new $.promise();
                if (self._called) {
                    this._event.once('stop', function() {
                        p.resolve();
                    });
                } else {
                    p.resolve();
                }

                return (p);
            }
            return ($.promise().reject());
        },

        /**
         * Start the loop back up from a stopped state
         *
         * @returns {boolean}
         */
        start: function() {
            if (!this._running) {
                this._running = true;
                this._run();
                return (true);
            }
            return (false);
        },

        /**
         * Normalize the time to int to be used in timeout
         *
         * @param time
         */
        time: function(time) {
            this._time = ($.time.is(time)) ? time.get : time;
        },

        /**
         * Add a condition for sub callback to reduce stacking callbacks
         *
         * @param tag
         * @param callback
         * @param c
         * @param cond
         * @returns {obj}
         */
        if: function(tag, callback, c, cond) {
            var self = this, t1 = this._if[tag] || 0, now = $.time.now().get, cur = (($.time.is(c)) ? c.get : c);
            if (t1 + cur < now && (!$.defined(cond) || cond)) {
                var tmp = callback(this);
                if ($.is.instance(tmp, $.promise) || tmp instanceof Promise) {
                    this._if[tag] = now + $.time.day(16).get;
                    tmp.then(function () {
                        self._if[tag] = now + cur;
                    });
                } else {
                    this._if[tag] = now + cur;
                }
            }
            return (this);
        }
    });

    module.exports = obj;
});