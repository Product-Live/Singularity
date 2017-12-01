"use strict";

var libPath = appRoot.engine + '/engine/core/lib/';

global.$ = {};

module.exports = {
	preConfig: function() {
		global.$.crypto = require(libPath + 'crypto.js');
		global.$.keychain = require(libPath + 'keychain.js'); // need to look into removing this from global
	},
	base: function(config) { // dependency free global libs
		// no config needed
		global.$.defined = function(a) { return (typeof(a) !== 'undefined' && a !== null); };
		global.$.not = function(a, b) { // this already exists in $.is.not
			if (typeof(b) === 'object' && Array.isArray(b)) {
				for (var i in b) {
					if (b[i] == a) {
						return (false);
					}
				}
				return (true);
			}
			return (a != b);
		};
		global.$.is = new (require(libPath + 'type.js'))();
		global.$.time = require(libPath + 'time.js');
		global.$.size = require(libPath + 'size.js');
		global.$.json = new (require(libPath + 'json.js'))();
		global.$.schema = new (require(libPath + 'schema.js'))();

		global.$.config = new (require(libPath + 'config.js'))(config);

		global.$.path = require(libPath + 'path.js');
		global.$.require = require(libPath + 'require.js');
		global.$.extends = $.require('core!/lib/extends.js');

		global.$.cast = new ($.require('lib!cast.js'))();
        global.$.version = $.require('lib!version.js');
        global.$.currency = new ($.require('lib!currency/util.js'))(); // this could be moved into core
        global.$.country = new ($.require('lib!country/util.js'))(); // this could be moved into core

		global.$.array = new ($.require('lib!array.js'))();
		global.$.string = new ($.require('lib!string.js'))();
        global.$.function = new ($.require('lib!function.js'))();
		global.$.object = new ($.require('lib!object.js'))();

		// promise
        var p = $.require('lib!promise.js')(config.promise);
		global.$.promise = p.promise;
		global.$.all = p.all;

        // async
        global.$.key = $.require('lib!key.js');
        global.$.file = new ($.require('lib!file.js'))();
        global.$.midware = $.require('lib!middleware.js');
	},

    npm: function() { // globals that have a npm dependency
		var c = $.require('lib!console.js'); // did this a while ago don't like it anymore maybe remove?
		global.$.console = c.log;
		global.$.color = c.color;

		global.$.model = $.require('lib!model.js');
		global.$.cog = $.require('lib!cog.js');
	}
};
