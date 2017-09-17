"use strict";

module.exports = $.model(function(m) {
    m.name('moduleCdn').init({
        path:  m.type('string').default(''),
        source:  m.type('string').default(''),
        priority: m.type('int').default(0)
    });
});