"use strict";

$.require([
    'core!/server/webSocket/native/message.js',
    'core!/server/webSocket/native/socket.js',
    'npm!ws',
    'node!events'
], function(
    message,
    client,
    WebSocket,
    events
) {

    var obj = function(param) {
        this._param = param;
        this._clients = [];
        this._events = new events();
        this.init();
    };

    obj.prototype = $.extends('!base', {
        _close: function(wrapper) {
            var id = wrapper.id();
            delete this._clients[id];
            $.console.log($.color.yellow(id + " disconnected "));
            wrapper.close();
        },

        init: function() {
            var self = this;
            this.ws = new WebSocket.Server({port: this._param.port});

            this.ws.on('connection', function(socket) {
                var wrapper = new client(socket);
                self._clients[wrapper.id()] = {
                    date: new Date().getTime(),
                    address: socket.domain
                };

                socket.on('message', function(m) {
                    self._events.emit('message', new message(wrapper, $.json.parse(m)));
                });

                socket.on('error', function() {
                    console.log('websocket error client', err);
                    self._close(wrapper);
                });
                socket.on('close', function() {
                    self._close(wrapper);
                });
            });

            this.ws.on('error', function(err) {
                console.log('websocket error', err);
            })
        },

        getClients: function() {
            return (this._clients);
        },

        on: function(e, c) {
            this._events.on(e, c);
            return (this);
        }
    });

    module.exports = obj;
});