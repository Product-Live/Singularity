"use strict";

$.require([
	'lib!console/logger.js'
], function(
	logger
) {

	var obj = function (c) {
		var config = c || {}, self = this;
		this._callback = null;
		this._hooked = [];
		this._run = null;
		this._pulse = config.pulse || $.time.minute(5).get;
		this._closing = 0;

		this._alive();
		process.on('exit', function (code) {
			self._exit(code);
		}).on('SIGINT', function () {
            console.log('Application close because of a SIGINT.');
			self._closing += -1;
			self._exit(2);
		}).on('uncaughtException', function (e) {
            console.log('The was a uncaught exception', e.stack);
			self._closing += -1;
			self._exit(99);
		});
	};
	obj.prototype = {
		/**
		 * Keep the app alive even without any async or on going handles (most cases this is not needed but still)
		 *
		 * @private
		 */
		_alive: function () {
			var self = this;
			this._run = setTimeout(function () {
				self._alive();
			}, this._pulse);
		},

		/**
		 * Shutdown logic
		 *
		 * @param code
		 * @private
		 */
		_exit: function (code) {
			if (this._closing <= 0) {
				var self = this, p = new $.promise();

				this._closing = 5;
				var wait = [];
				for (var i in this._hooked) {
					if ($.is.function(this._hooked[i])) {
						wait.push(this._hooked[i](code));
					}
				}

				$.all(wait).then(function() {
					return (true);
				}, function(e) {
					return (true);
				}).then(function() {
					if ($.defined(self._callback)) {
						var tmp = self._callback(code);
						if ($.is.instance(tmp, $.promise) || tmp instanceof Promise) {
							tmp.then(function () {
								p.resolve();
							}, function (err) {
								console.log('exit callback error', err);
								p.resolve();
							});
						} else {
							p.resolve();
						}
					} else {
						p.resolve();
					}
				});

				p.then(function () {
					/*var hook = new (require($.path('core!lib/hook.js')))();
					hook.dump();

                    var l = new logger(); // save log still in memory (base system thing)
                    console.log('saving logs ...');
                    return (l.close());*/
					return true;
                }).then(function () {
                    console.log('exit sent to process', code);
                    clearTimeout(self._run); // kill app pulse
                    process.exit(code);
                });
			}
		},

		/**
		 * On close run callback
		 *
		 * @param c
		 * @returns {obj}
		 */
		on: function(c) {
			this._hooked.push(c);
			return (this);
		},

		final: function(c) {
			this._callback = c;
			return (this);
		}
	};

	module.exports = obj;
});
