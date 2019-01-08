"use strict";

const path = require('path');
const self = {
    path: $.config.get('require.path') || {},
    normalize: function(p) {
        return path.normalize(p).replace(/\\/g, '/').replace(/\/{2,}/g, '/');
    },
    get: function(s) {
        if (typeof(s) != 'string') {
            throw new Error('value given is wrong type');
        }

        var str = s.split('!');
        if (str.length > 1) {
            if (!$.defined(this.path[str[0]])) {
                throw new Error('not path defined for prefix "' + str[0] + '" full ' + s);
            }

            var path = this.path[str[0]];
            return (this.normalize(((path == '')? '' : (path + '/')) + str[1]));
        }
        return (this.normalize(str[0]));
    }
};

module.exports = function(path) {
    return (self.get(path));
};