"use strict";

$.require([
	//
], function(
	//
) {

    var wrap = function() {
        this._action = [];
        this._cmd = '';
    };
    wrap.prototype = {
        from: function(a) {
            this._from = a;
            return (this);
        },
        run: function(a) {
            this._action.push('RUN ' + a);
            return (this);
        },
        env: function(a) {
            this._action.push('ENV ' + a);
            return (this);
        },
        copy: function(a, b) {
            this._action.push('COPY ' + a + ' ' + b);
            return (this);
        },
        workdir: function(a) {
            this._action.push('WORKDIR ' + a);
            return (this);
        },
        cmd: function(a) {
            this._cmd = a;
            return (this);
        },
        script: function(func) {
            this._func = func;
            return (this);
        }
    };

    var action = function(wrap, key) {
        this._wrap = wrap;
        this._key = key;
    };
    action.prototype = {
        setup: function(data) {
            if (this._wrap._func) {
                let p = this._wrap._func(data);
                return ($.is.object(p) && $.is.function(p.then)) ? p : $.promise().resolve();
            }
            return $.promise().resolve();
        },

        toString: function() {
            var a = '';
            if (this._wrap._from) {
                a += 'FROM ' + this._wrap._from + '\n';
            }
            a += this._wrap._action.join('\n') + '\n';
            a += 'CMD ' + this._wrap._cmd;
            return (a);
        },

        path: function() {
            return ($.path('cache!/buildImage/' + this._key));
        },

        create: function() {
            var self = this;
            return ($.file.create(this.path()).then(function(res) {
                return ($.file.write(self.path() + '/DockerFile', self.toString()));
            }));
        }
    };

	var obj = function() {
        this._list = {};
        this._key = {};
    };
	obj.prototype = {
        create: function() {
            return (new wrap());
        },

        path: function(key) {
            return ($.path('cache!/buildImage/' + $.crypto.hash(key)));
        },

        add: function(key, build) {
            if ($.is.instance(build, wrap)) {
                this._list[key] = build;
                this._key[key] = $.crypto.hash(key);
                return (this);
            }
            throw new Error('is not a build object created by .create method');
        },

        get: function(key) {
            if (this._list[key]) {
                return (new action(this._list[key], this._key[key]));
            }
        }
	};

	module.exports = new obj();
});
