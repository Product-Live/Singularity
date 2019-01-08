"use strict";

$.require([
    'npm!mongodb'
], function(
    mongodb
) {

    /**
     * Static function to be used anywhere
     *
     * @type {{ObjectID: Function}}
     */
    module.exports = {
        ObjectID: function(id) {
            if ($.is.instance(id, mongodb.ObjectID) || !$.defined(id) || id.length !== 24) {
                return (id);
            }
            return (new mongodb.ObjectID(($.defined(id) && id.length == 24)? id : '000000000000000000000000'));
        }
    };

});