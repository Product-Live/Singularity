"use strict";

$.require([
    'core!think'
], function(
	think
) {

	var obj = function() {
        this._conf = $.config.get('console.save');
        if (!this._conf) {
            //console.warn('missing config for $.console.log will not be able to save');
            return; // lets not load the without config
        }

        this._storage = [];
        this._runSession = this._sessionName();
        this._stream = ($.is.got('stream', this._conf.type));

        if (!this._stream) {
            var self = this, rate = $.config.get('console.save.rate'), max = $.config.get('console.save.maxInMemory');
            this._think = new think(function (hook) {
                if (self._storage.length > max) { // hit the max save them
                    return (self.save());
                }

                hook.if('rate', function () { // save after x minute anyway
                    return (self.save());
                }, rate);
            }, $.time.second(10).get);
        }
	};
	obj.prototype = $.extends('!base', {
        _sessionName: function() {
            var a = '', key = ['machine', 'name', 'session'];
            for (var i in key) {
                a += ($.config.get('env.' + key[i]) || key[i].toUpperCase()) + '_';
            }
            return (a + $.key.number());
        },
        _saveType: {
            stream: $.require('lib!/console/logger/save/stream.js'),
            //mongo: $.require('lib!/console/logger/save/mongo.js')
        },
        _instance: {},

        /**
         * Get all stack for log as array
         *
         * @returns {Array}
         * @private
         */
        _stack: function() {
            var e = new Error(), stack = e.stack.split('\n');
            return (stack.splice(8, 3));
        },

        /**
         * Create log entry
         *
         * @param log
         * @param name
         * @returns {*}
         */
        log: function(log, name) {
            var conf = $.config.get('console.logger.' + name), env = $.config.get('env');

            if (!conf || !this._conf) {
                return ({});
            }
            
            var struct = {
                id: $.key.plain(),
                logDate: $.time.now().get,
                machine: env.session,
                container: env.name || 'missing',
                application: 'connector_' + $.config.get('env.profile'),
                environment: env.env,
                criticity: conf.level,
                tag: conf.tag,
                payload: {
                    log: log,
                    stack: this._stack()
                }
            };

            if (this._stream) {
                if (!$.defined(this._instance.stream)) {
                    this._instance.stream = new this._saveType.stream($.schema.merge({
                        name: this._runSession
                    }, this._conf.config.stream || {}));
                }
                this._instance.stream.save(struct);
            } else {
                this._storage.push(struct);
            }
            return (struct);
		},

        /**
         * Save logs in storage into db
         *
         * @returns {*|String|obj}
         */
        save: function() {
            var stored = this._storage, conf = $.config.get('console.save');
            if (!conf || !stored) {
                return ($.promise().resolve());
            }
            this._storage = [];
            if (stored.length == 0 || this._stream) { // skip if empty
                return ($.promise().resolve());
            }

            var type = ($.is.array(conf.type)) ? conf.type : [conf.type], wait = [];
            for (var i in type) { // run all save on all the type listed
                if ($.defined(this._saveType[type[i]])) {
                    var r = new this._saveType[type[i]]($.schema.merge({
                        name: this._runSession
                    }, conf.config[type[i]] || {}));


                    for (var i in stored) {
                        wait.push(r.save(stored[i]));
                    }
                } else {
                    throw new Error(type[i] + ' is not a valid type to use on log saving.');
                }
            }

            return ($.all(wait));
        },

        /**
         * Stop think and dump storage into db
         *
         * @returns {*}
         */
        close: function() {
            var wait = [this.save()];
            if (this._think) {
                wait.push(this._think.stop());
            }
            for (var i in this._loaded) {
                console.log(i, this._loaded[i]);
                wait.push(this._loaded[i].close());
            }
            return ($.all(wait));
        }
	});

	module.exports = obj;
});
