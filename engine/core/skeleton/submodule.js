"use strict";

const core = require('./Singularity/core.js'), base = (require('path').resolve(__dirname)).replace(/\\/g, '/');

core({
    absoluteRoot: base,
    projectRoot: base + '/app',
    command: function(c, config) {
        var hyperion = {};

        c.if('release', function() {
            config.upstartWrap = false;
            config.mongoProfile = 'build';
            hyperion.release = c.get('release') || true;
        });

        c.if('tag', function() {
            hyperion.tag = c.get('tag') || true;
        });

        c.if('version', function() {
            hyperion.version = c.get('version') || true;
        });

        config.hyperion = hyperion;
    }
});
