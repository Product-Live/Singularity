"use strict";

$.require([
    'lib!console/logger.js',
    'lib!console/color/core.js',
    'lib!console/base.js'
], function(
    logger,
    color,
    base
) {

    var obj = function(name) {
        this._name = name;
        this._logger = new logger(name);
    };
    obj.prototype = $.extends(base, {
        /**
         * Is the string given a color code
         *
         * @param str
         * @returns {*|AggregationCursor|Array|{index: number, input: string}}
         * @private
         */
        _isColor: function(str) {
            return ($.is.string(str) && str.match(/\x1b\[\d+m/));
        },

        /**
         * Build plain version of data for Log
         *
         * @param out
         * @returns {Array}
         * @private
         */
        _buildPlain: function(out) {
            var plain = [];
            for (var i in out) {
                if (!this._isColor(out[i])) {
                    if ($.is.object(out[i]) || $.is.array(out[i])) {
                        plain.push($.json.stringify(out[i]));
                    } else {
                        plain.push(out[i]);
                    }
                }
            }
            return (plain);
        },

        /**
         * Crunch colors and string to reduce spaces in console.log
         *
         * @param out
         * @returns {*}
         * @private
         */
        _crunchColor: function(out) {
            var i = 0;
            while ($.defined(out[i])) {
                if (this._isColor(out[i]) && $.is.string(out[i + 1])) {
                    out[i] += out.splice(i + 1, 1)[0];
                }
                i += 1;
            }
            if ($.is.string(out[out.length - 1])) {
                out[out.length - 1] += '\x1b[0m';
            } else {
                out.push('\x1b[0m');
            }
            return (out);
        },

        /**
         * Build Log to be used in print
         *
         * @param array
         * @returns {{plain: (*|Array), color: *}}
         * @private
         */
        _buildLog: function(array) {
            var conf = this._config(), last = null, out = [];
            for (var i in array) {
                if ($.is.instance(array[i], color)) {
                    if ($.defined(last)) {
                        out = out.concat(last.toArray());
                        last = null;
                    }
                    out = out.concat(array[i].toArray());
                } else {
                    if (!$.defined(last)) {
                        last = new color();
                    }
                    var col = ($.is.function(last[conf.color])) ? conf.color : 'none';
                    last[col].apply(last, ($.is.array(array[i]))? array[i] : [array[i]]);
                }
            }
            if ($.defined(last)) {
                out = out.concat(last.toArray());
            }

            return ({
                plain: this._buildPlain(out),
                color: this._crunchColor(out)
            });
        },

        /**
         * Print Log with Color management
         *
         * @param array
         * @returns {obj}
         */
        print: function(array) {
            var conf = this._config();
            if (!conf.display && !conf.log) {
                return (this);
            }

            var build = this._buildLog(array);
            if (conf.display) {
                console.log.apply(console.log, build.color);
            }
            if (conf.log) {
                this._logger.log(build.plain);
            }
            return (this);
        }
    });

    module.exports = obj;
});
