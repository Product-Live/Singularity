"use strict";

$.require([
    'lib!key/core.js',
    'lib!key/type/number.js',
    'lib!key/type/plain.js',
    'lib!key/type/seed.js',
	'lib!key/type/long.js',
    'lib!key/type/short.js',
    'lib!key/type/random.js'
], function(
    core,
    number,
    plain,
    seed,
    long,
    short,
    random
) {

    /**
     * key generator system
     */
    var c = new core();
    c.add('number', new number(c));
    c.add('plain', new plain(c));
    c.add('seed', new seed(c));
    c.add('long', new long(c));
    c.add('short', new short(c));
    c.add('random', new random(c));

	module.exports = c.format();
});