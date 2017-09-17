"use strict";

/*
if a website is a string 'api.localhost' will not use the "." as match any char

example origin is 'api_localhost'
'api.localhost' is false
/api.localhost/ is true

{
    website: ['localhost', /^\d*\.0\.0\.1$/],
    method: ['get', 'post'],
    path: /\/player\/:id\/info\// || '/player/:id/info',
    param: {
        id: '[0-9]+'
    },
    action: {
        controller: 'player',
        method: 'getInfo'
    }
}
*/

module.exports = $.model(function(m) {
    m.name('moduleRoute').init({
        website: m.type('array').default([null]).cast(function(data) { // added support for regex address
            for (var i in data) {
                if ($.is.instance(data[i], RegExp)) {
                    var d = data[i].toString();
                    data[i] = {
                        type: 'regex',
                        regex: d.substring(1, d.length - 1),
                        toString: function() {
                            return (this.regex);
                        }
                    }
                }
            }
            return (data);
        }),
        priority: m.type('int').default(0),
        api: m.type('array').default(['http']), // ['http', 'webSocket', 'socket']
        method: m.type('array').default(['get', 'post', 'delete', 'put']),
        path: m.type('string').default(''), // supports regex and merges the regex from param
        param: m.type('object').default({}), // regex match
        action: { // controller needs to be static (public || private)
            controller: m.type('string').default(''), // filename in {module}/controller/{name}
            method: m.type('string').default('') // function found in controller
        }
    });
});
