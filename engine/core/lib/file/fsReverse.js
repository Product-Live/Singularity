"use strict";
$.require([
    'node!events',
    'node!fs'
], function(
    events,
    fs
) {

    var obj = function(file, opt) {
        this._$ = {
            pos: 0,
            size: 0,
            block: opt.block || 1024,
            read: true,
            reading: false
        };
        this._file = file;
        this._event = new events();
    };
    obj.prototype = {
        initPos: function() {
            var sundef = false;
            if (!$.defined(this._$.start)) {
                this._$.start = 0;
                sundef = true;
            }

            if (!$.defined(this._$.end)) {
                this._$.end = 0;
            }

            if (this._$.end > this._$.start) {
                var st = this._$.start;
                this._$.start = this._$.end;
                this._$.end = st;
            }

            if (this._$.start > this._$.pos) {
                this._$.start = this._$.pos;
            } else if(sundef) {
                this._$.start = this._$.pos;
            }

            this._$.pos = this._$.start + 1;
            this._$.remaining = this._$.start - this._$.end + 1;

            return (this);
        },

        close: function() {
            var self = this;
            this._$.read = false;
            fs.close(this._$.fd, function() {
                self._event.emit('close');
            });
        },

        read: function(fd, size, pos) {
            var self = this, p = new $.promise();

            this._$.reading = true;
            fs.read(fd, new Buffer(size), 0, size, pos, function(err, bytesRead, buf) {
                self._$.reading = false;
                process.nextTick(function(){
                    p.resolve({
                        err: err,
                        bytes: bytesRead,
                        buffer: buf
                    });
                });
            });

            return (p);
        },

        readChunk: function() {
            if (!$.defined(this._$.pos)) {
                return ($.promise().resolve());
            }

            var self = this, run = function() {
                if (self._$.remaining < self._$.block) {
                    self._$.block = self._$.remaining;
                }

                var pos = self._$.pos - self._$.block;
                return (self.read(self._$.fd, self._$.block, pos).then(function(res) {
                    self._$.pos -= res.bytes;
                    self._$.remaining -= res.bytes;

                    if (res.err) {
                        self._event.emit('error', err);
                        return (true);
                    }

                    if (!self._$.remaining) {
                        self.close();
                        self._event.emit('data', res.buffer);
                        self._event.emit('end', null);
                        return (true);
                    } else {
                        self._event.emit('data', res.buffer);
                        if (self._$.read) {
                            return (run());
                        }
                    }
                }));
            };
            
            return (run());
        },

        start: function() {
            var self = this;

            fs.open(this._file, 'r', function(err, fd) {
                if (err) {
                    return (self._event.emit('error', err));
                }
                self._$.fd = fd;
                self._event.emit('open', fd);

                fs.fstat(fd, function(err, stat) {
                    if (err) {
                        return (self._event.emit('error', err));
                    }
                    self._$.pos = stat.size - 1;
                    self._event.emit('stat', stat);

                    self.initPos().readChunk();
                });
            });

            return (this);
        },

        handle: function() {
            var ent = this._event, self = this;

            return ({
                on: function(e, c) {
                    return (ent.on(e, c))
                },
                once: function(e, c) {
                    return (ent.once(e, c))
                },
                close: function() {
                    self.close();
                    return (this);
                }
            });
        }
    };

    /**
     * Warning This has not been tested with real stream pipes (may need a recode)
     *
     * @param file
     * @param opt
     * @returns {*}
     */
    module.exports = function(file, opt) {
        var a = new obj(file, opt || {});
        return (a.start().handle());
    };
});