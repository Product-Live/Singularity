"use strict";

$.require([
	'core!/lib/file/fsReverse.js',
	'node!fs'
], function(
	fsReverse,
	fs
) {
    
	var obj = function() {};
	obj.prototype = $.extends('!base', {
        constants: fs.constants,

		rename: function(oldPath, newPath) {
			var p = new $.promise();

			fs.rename($.path(oldPath), $.path(newPath), function(err) {
				p[(err)? 'reject' : 'resolve'](err);
			});
			
			return (p);
		},

		access: function(path, mode) {
			var p = new $.promise();

			fs.access($.path(path), mode, function(err) {
				p[(err)? 'reject' : 'resolve'](err || $.path(path));
			});

			return (p);
		},

		chmod: function(path, mode) {
			var p = new $.promise();

			fs.chmod($.path(path), mode, function(err) {
				p[(err)? 'reject' : 'resolve'](err);
			});

			return (p);
		},

		chown: function(path, uid, gid) {
			var p = new $.promise();

			fs.chmod($.path(path), uid, gid, function(err) {
				p[(err)? 'reject' : 'resolve'](err);
			});

			return (p);
		},

		fchmod: function(path, mode) {
			var p = new $.promise();

			fs.fchmod($.path(path), mode, function(err) {
				p[(err)? 'reject' : 'resolve'](err);
			});

			return (p);
		},

		fstat: function(path) {
			var p = new $.promise();

			fs.fchmod($.path(path), function(err) {
				p[(err)? 'reject' : 'resolve'](err);
			});

			return (p);
		},

		link: function(existingPath, newPath) {
			var p = new $.promise();

			fs.link($.path(existingPath), $.path(newPath), function(err) {
				p[(err)? 'reject' : 'resolve'](err);
			});

			return (p);
		},

		mkdir: function(path, mode) {
			var p = new $.promise();

			fs.mkdir($.path(path), mode, function(err) {
				p[(err)? 'reject' : 'resolve'](err);
			});

			return (p);
		},

		readDir: function(path, options) {
			var p = new $.promise();

			fs.readdir($.path(path), options, function(err, res) {
				p[(err)? 'reject' : 'resolve'](err || res);
			});

			return (p);
		},

		readFile: function(file, options) {
			var p = new $.promise(), a = [$.path(file), function(err, res) {
				p[(err)? 'reject' : 'resolve'](err || res);
			}];

			fs.readFile.apply(fs, (($.defined(options)? a.splice(1, 0, options) : null), a));

			return (p);
		},

		rmDir: function(path) {
			var p = new $.promise();

			fs.rmdir($.path(path), function(err) {
				p[(err)? 'reject' : 'resolve'](err);
			});

			return (p);
		},

		stat: function(path) {
			var p = new $.promise();

			fs.stat($.path(path), function(err, res) {
				p[(err)? 'reject' : 'resolve'](err || res);
			});

			return (p);
		},

		unlink: function(path) {
			var p = new $.promise();

			fs.unlink($.path(path), function(err) {
				p[(err)? 'reject' : 'resolve'](err);
			});

			return (p);
		},

		writeFile: function(file, data, options) {
			var p = new $.promise();

			fs.writeFile($.path(file), data, options, function(err) {
				p[(err)? 'reject' : 'resolve'](err);
			});

			return (p);
		},

		createWriteStream: function(path, opt) {
			return (fs.createWriteStream($.path(path), opt));
		},

		createReadStream: function(path, opt) {
			opt = $.is.object(opt)? opt : {};
			return ((opt.reverse)? fsReverse($.path(path), opt) : fs.createReadStream($.path(path), opt));
		}
	});

	module.exports = new obj();
});