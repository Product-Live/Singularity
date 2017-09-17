"use strict";

/**
 * Resolve once all promise give in the array are complete
 * @param array
 * @returns {*}
 */
module.exports = function(array) {
    return (Promise.all(array));
};