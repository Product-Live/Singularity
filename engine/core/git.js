"use strict";

$.require([
    'core!bash'
], function(
    bash
) {

    var obj = function(url, option) {
        this._url = url;
        this._option = option;
        this._key = $.defined(this._option.name) ? this._option.name : $.crypto.hash($.config.get('env.session') + '.' + this._url);
        //this._name = (this.getPath().match(/([^\/]*)\/*$/)[0] || '').replace(/\/$/, '');
        // test this._url to see if it's a url
        // test this._key for the format it needs to be
        // PPL CAN USE THIS AT FACE VALUE AND THINK ITS SAFE AND THROW USER INPUT INTO IT
    };
    obj.prototype = {
        _getPath: function(full) {
            var base = (this._option.path)? this._option.path : 'cache!/git';
            return ($.path(base + '/' + ((full)? this._key : '')));
        },

        _bash: function(cmd) {
            var self = this;
            return (bash.raw(cmd, {cwd: this._getPath(!cmd.match('git clone'))}, this._option.debug).then(function(res) {
                if (self._option.debug) {
                    console.log(res);
                }
                return ((res.out[0] || '').replace('\n', '').trim());
            }, function(err) {
                if (self._option.debug) {
                    console.log(err);
                }
                return (err);
            }));
        },

        clone: function(recursive) {
            return (this._bash('git clone ' + ((recursive)? '--recursive ' : '') + this._url + ' ' + this._key));
        },

        version: function() {
            return (this._bash('git --version'));
        },

        getOrigin: function() {
            return (this._bash('git remote get-url origin'));
        },

        setOrigin: function() {
            return (this._bash('git config remote.origin.url "' + this._url + '"'));
        },

        pull: function() {
            return (this._bash('git pull'));
        },

        fetch: function() {
            return (this._bash('git fetch --quiet --all'));
        },

        status: function() {
            return (this._bash('git rev-parse HEAD'));
        },

        reset: function(hash) {
            // add regex to see if it's a hash;
            return (this._bash('git reset --hard ' + hash));
        }
    };

    module.exports = obj;
});
