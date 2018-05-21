"use strict";

$.require([
    'node!zlib',
    'core!/mime.js'
], function(
    zlib,
    mime
) {

    var obj = function(core, res, req) {
        this._core = core;
        this._res = res;
        this._req = req;
        this._encode = (this._req.headers['accept-encoding'] || '').match('gzip') ? 'gzip' : null;

        this.headersSent = false; // Boolean property that indicates if the app sent HTTP headers for the response.
        this._status = 200;
        this._head = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Cache-Control, Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With'
        };
    };

    obj.prototype = $.extends('!base', {
        /**
         * Appends the specified value to the HTTP response header field
         *
         * @param field
         * @param value
         * @returns {obj}
         */
        append: function(field, value) {
            this._head[field] = value;
            return (this);
        },

        res: function() {
            return (this._res);
        },

        /**
         * Sets the response’s HTTP header field to value
         *
         * @param field
         * @param value
         * @returns {obj}
         */
        set: function(field, value) {
            if ($.is.object(field)) {
                for (var i in field) {
                    this._head[i.toLowerCase()] = field[i];
                }
            } else {
                this._head[field.toLowerCase()] = value;
            }
            return (this);
        },

        /**
         * Sets the HTTP status for the response
         *
         * @param code
         * @returns {obj}
         */
        status: function(code) {
            this._status = code;
            return (this);
        },

        /**
         * Sets the Content-Type HTTP header
         *
         * @param type
         */
        type: function(type) {
            return (mime.lookup(type));
        },

        /**
         * serves file to client many?
         *
         * @param path
         * @returns {obj}
         */
        attachment: function(path) {
            // TODO: build
            return (this);
        },

        /**
         * Set cookie
         *
         * @param name
         * @param value
         * @param options
         */
        cookie: function(name, value, options) {
            // TODO: build
            return (this);
        },

        /**
         * Remove cookie from value
         *
         * @param name
         * @param value
         */
        clearCookie: function(name) {
            // TODO: build
            return (this);
        },

        /**
         * Transfers the file at path as an “attachment”. Typically, browsers will prompt the user for download
         *
         * @param path
         * @param filename
         * @param fn
         */
        download: function(path, filename, fn) {
            // TODO: build
            return (this);
        },

        /**
         * Ends the response process
         *
         * @param data
         * @param encoding
         */
        end: function(data, encoding) {
            this.headersSent = true;
            this._res.end(data, encoding);
            return (this);
        },

        /**
         * Returns the HTTP response header
         *
         * @param field
         */
        get: function(field) {
            return (this._head[field]);
        },

        /**
         * Send json as response
         *
         * @param body
         */
        json: function(body) {
            var json = $.json.encode(body);
            if (!$.defined(json)) {
                console.log(body, json);
                throw new Error('failed to encode object into json.');
            }
            return (this.set({
                'Content-Type': mime.lookup('json'),
                'Content-Length': Buffer.byteLength(json)
            }).send(json || ''));
        },

        /**
         * Redirects to the URL derived from the specified path
         *
         * @param status
         * @param path
         */
        redirect: function(status, path) {
            if ($.is.string(status)) {
                return (this.set('Location', status).end())
            }
            return (this.status(status).set('Location', path).end())
        },

        /**
         * Send raw data to client
         *
         * @param body
         */
        send: function(body) {
            if (this._encode == 'gzip') {
                var self = this;
                zlib.gzip(body, function(err, res) {
                    self.set({
                        'content-encoding': self._encode,
                        'Content-Length': res.length
                    });
                    self._res.writeHead(self._status, self._head);
                    self._res.write(res);
                    self.end();
                });
            } else {
                this.set('Content-Length', Buffer.byteLength(body));
                this._res.writeHead(this._status, this._head);
                this._res.write(body);
                this.end();
            }
            return (this);
        },

        pipe: function(stream) {
            this.headersSent = true;
            this._res.writeHead(this._status, this._head);
            stream.pipe(this._res);
            return (this);
        },

        raw: function(body) {
            return (this.send(body));
        }
    });

    module.exports = obj;
});
