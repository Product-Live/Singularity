"use strict";

module.exports = function(force) {
    var version = new $.version(process.version);

    var list = [
        '1460970692390236298154412308228631389396'
    ];

    /*if (force === 'nodep' || $.is.got($.config.get('env.session'), list) || $.config.get('env.profile') == 'hyperion') {
        var type = 'nodep'; // I hate the try and catch on the em6 version
    } else {
        var type = (version.great('5.0.0') && $.is.function(Promise)) ? 'em6' : 'em6';
    }*/
    var type = 'nodep';
    //console.log('promise using:', type);

    return ({
        promise: $.require('lib!/promise/' + type + '/promise.js'),
        all: $.require('lib!/promise/' + type + '/all.js')
    });
};