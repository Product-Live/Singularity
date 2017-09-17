"use strict";

module.exports = $.model(function(m) {
    m.name('moduleImport').init({
        module: m.type('string').default(''),
        path:  m.type('string').default(''),
        as:  m.type('string').default(null)
    });
});