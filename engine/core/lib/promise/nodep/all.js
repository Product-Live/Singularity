"use strict";

/**
 * Resolve once all promise give in the array are complete
 * @param array
 * @returns {*}
 */
var count = 0;
module.exports = function(array) {
	var p = new $.promise(), rep = 0, error = false, out = [];

    if (rep == array.length) {
        p.resolve(out);
    } else {
        for (var i in array) {
            if ($.is.instance(array[i], $.promise) || $.is.instance(array[i], Promise)) {
                (function (i) {
                    array[i].then(function (res) {
                        out[i] = res;
                        rep += 1;
                        if (rep == array.length) {
                            p[(error) ? 'reject' : 'resolve'](out);
                        }
                    }, function (err) {
                        error = true;
                        out[i] = err;
                        rep += 1;
                        if (rep == array.length) {
                            p.reject(out);
                        }
                    });
                })(i);
            } else {
                throw new Error('$.all: row is not a promise.' + i);
            }
        }
    }

    return (p);
};