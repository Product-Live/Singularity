"use strict";

$.require([
    'lib!cog/core.js'
], function(
    core
) {

    /**
     * Create new base cog
     *
     * @param scope
     * @returns {*}
     */
    module.exports = function(scope) {
        return (new core(scope));
    };
});