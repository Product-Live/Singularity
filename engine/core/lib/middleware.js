"use strict";

$.require([
    //
], function(
    //
) {

    var scope = function(callB, scope) {
        this.callB = callB;
        this._ = {
            scope: scope,
            called: false,
            p: new $.promise()
        };
    };
    scope.prototype = {
        next: function() {
            if (!this._.called) {
                let self = this;
                this._.called = true;
                var tmp = self.callB.apply(self._.scope, arguments);
                if ($.is.instance(tmp, $.promise) || tmp instanceof Promise) {
                    tmp.then(function () {
                        self._.p.resolve(arguments);
                    }, function () {
                        self._.p.reject(arguments);
                    });
                } else {
                    self._.p.resolve(tmp);
                }
            }
        },
        end: function() {
            this._.p.resolve(arguments);
        }
    };

    var util = {
        parse: function(c) {
            var call = ($.is.array(c))? c : [c], func = call[0], scope = func;
            for (var i = 1; i < call.length; i++) {
                scope = func;
                func = func[call[i]];
            }
            return ({
                scope: scope,
                func: func
            })
        }
    };

    module.exports = function(cA, callB) {
        return (function() {
            var /*_ = new scope(callB, this),*/ callA = util.parse(cA);

            if (!$.is.function(callA.func)) {
                throw new Error('did not receive is not a valid function.');
            }

            var arg = arguments, self = this, tmp = callA.func.apply(callA.scope, arg);
            if ($.is.instance(tmp, $.promise) || $.is.instance(tmp, Promise)) {
                //_.called = true;
                return (tmp.then(function() {
                    return (callB.apply(self, arg));
                }, function(err) {
                    return ($.promise().resolve(err));
                }));
            } else {
                return (callB.apply(self, arguments));
                //return (_._.p);
            }
        });
    };
});