"use strict";

$.require([
    'node!fs'
], function(
    fs
) {

    /**
     * Watch files if they change kill the application
     */
    var obj = function(path) {
        this._path = ($.is.array(path)) ? path : [path];
        this._watch = [];
        console.log($.color.cyan('--\tDev Watcher running\t--'));
        for (var i in this._path) {
            this.load($.path(this._path[i]));
        }
    };
    obj.prototype = $.extends('!base', {
        load: function(path) {
            var self = this;

            return ($.file.stat(path).then(function(r) {
                try {
                    self._watch.push(fs.watch(path, {encoding: 'buffer'}, function (event, filename) {
                        if (filename) {
                            self.close(filename);
                        }
                    }));
                } catch(e) {
                    console.log('watcher failed', e);
                }

                if (r.stats.isDirectory()) {
                    return ($.file.list(path).then(function(r) {
                        var wait = [];
                        for (var i in r.files) {
                            wait.push(self.load(path + '/' + r.files[i]));
                        }
                        return ($.all(wait));
                    }));
                }
                return (true);
            }));
        },
        
        close: function(filename) {
            console.log($.color.cyan('--\tfile change reload app\t--'), filename);
            for (var i in this._watch) {
                this._watch[i].close();
            }
            process.exit();
        }
    });

    module.exports = obj;
});