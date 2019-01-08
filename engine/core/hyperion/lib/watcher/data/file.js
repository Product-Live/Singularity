"use strict";

$.require([
    'core!database/mongo',
    'hyperion!/lib/watcher/data/model/config.js'
], function(
    mongo,
    config
) {

    var obj = function () {};
    obj.prototype = {
        is: function() {
            return ($.promise().resolve());
        },

        get: function(original, key) {
            var self = this;
            return $.file.read('resources!/hypeMap.json').then(function(res) {
                var copy = $.schema.copy(original), data = config.create();
                data.set(copy).set($.json.parse(res) || {});
                return (data.get());
            }, function(e) {
               return (self.set(key, original));
            });
        },

        set: function(key, data) {
            return $.file.write('resources!/hypeMap.json', $.json.encode(config.create().set($.schema.copy(data)).get(), null, '\t'));
        },

        disable: function(key, error) {
            return ($.promise().resolve());
        }
    };

    module.exports = obj;
});