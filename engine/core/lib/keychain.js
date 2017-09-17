"use strict";

var fs = require('fs');

var obj = function(config) {
    this._crypto = {
        algorithm: 'aes-256-ctr',
        password: config.password
    };
    this._config = {
        path: config.path
    };
    this._load = false;
    this._keys = {};
    this._cachePath = {};
};
obj.prototype = {
    encrypt: function(text) {
        return ($.crypto.encrypt(this._crypto.algorithm, this._crypto.password, text));
    },
    
    decrypt: function(text) {
        return ($.crypto.decrypt(this._crypto.algorithm, this._crypto.password, text));
    },

    build: function() {
        try {
            var stats = fs.statSync(this._config.path + 'chain.json');

            if (stats) {
                var data = fs.readFileSync(this._config.path + 'chain.json', 'utf8');
                if (data) {
                    var json = JSON.parse(data), format = this.encrypt(JSON.stringify(json));
                    fs.writeFileSync(this._config.path + 'chain.aes', format);
                    return (format);
                }
            }
        } catch (e) {}
        throw new Error('missing chain.json can\'t encrypt json to ' + this._crypto.algorithm);
    },

    extract: function() {
        try {
            var stats = fs.statSync(this._config.path + 'chain.aes');

            if (stats) {
                var data = fs.readFileSync(this._config.path + 'chain.aes', 'utf8');
                if (data) {
                    var raw = this.decrypt(data), json = JSON.parse(raw), format = JSON.stringify(json, null, '\t');
                    fs.writeFileSync(this._config.path + 'chain.json', format);
                    return (format);
                }
            }
        } catch (e) {}
        throw new Error('missing chain.aes can\'t extract to json');
    },

    load: function() {
        try {
            var stats = fs.statSync(this._config.path + 'chain.aes');

            if (stats) {
                var data = fs.readFileSync(this._config.path + 'chain.aes', 'utf8');
                if (data) {
                    var raw = this.decrypt(data), json = JSON.parse(raw);
                    return (json || {});
                }
            }
        } catch (e) {}
        return ({});
    }
};

module.exports = function(config) {
    return (new obj(config));
};