"use strict";

$.require([
    'lib!cog/cog.js'
], function(
    cog
) {

    var obj = function (scope) {
        this._formatList = {};
        this._scope = scope || $;
    };
    obj.prototype = {
        /**
         * Add api support
         *
         * @returns {obj}
         */
        add: function() { //TODO: add that if it exist already add to the chain
            var arg = [];
            for (var i in arguments) {
                arg.push(arguments[i]);
            }

            // add single
            if ($.is.string(arg[0]) && $.is.function(arg[1]) && $.is.function(arg[2])) {
                if (arg[0][0] != '_' && $.is.not(arg[0], ['add'])) {
                    this._formatList[arg[0]] = [arg[1], arg[2]];
                } else {
                    throw new Error('can\'t use "_" as a format name.');
                }
                return (this);
            }

            if ($.is.string(arg[0]) && arg[0][0] != '_' && $.is.not(arg[0], ['add'])) {
                var name = arg.splice(0, 1)[0];

                var chain = [];
                for (var i in arg) {

                    // support import for other files
                    if ($.is.string(arg[i])) {
                        var imp = this._scope.require(arg[i]);

                        if ($.is.instance(imp, obj) && $.is.array(imp._formatList[name])) {
                            chain = chain.concat(imp._formatList[name]);
                        }
                        if ($.is.array(imp) && imp.length == 2 && $.is.function(imp[0]) && $.is.function(imp[1])) {
                            chain.push(imp);
                        }
                    }

                    // support extra chain added
                    if ($.is.array(arg[i]) && arg[i].length == 2 && $.is.function(arg[i][0]) && $.is.function(arg[i][1])) {
                        chain.push([arg[i][0], arg[i][1]]);
                    }

                    // support chaining cogs into each other
                    if ($.is.instance(arg[i], obj) && $.is.array(arg[i]._formatList[name])) {
                        chain = chain.concat(arg[i]._formatList[name]);
                    }
                }

                this._formatList[name] = chain;
                return (this);
            }

            throw new Error('wrong arguments given.');
        },

        /**
         * Create new cog to use
         *
         * @returns {*}
         */
        create: function() {
            return (new cog(this._formatList));
        }
    };

    module.exports = obj;
});
