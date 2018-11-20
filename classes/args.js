'use strict';

module.exports = class Args {
    /**
     * @param {Object} input
     */
    constructor(input) {
        this._args = {};
        for (let i = 0; i < input.length; i++) {
            if (input[i].substr(0, 2) === '--' && input[i].indexOf('=') !== -1) {
                input[i] = input[i].split('=');
                this._args[input[i][0].replace('--', '')] = input[i].slice(1).join('=');
                continue;
            }
            if (input[i].substr(0, 2) === '--') {
                this._args[input[i].replace('--', '')] = input[++i];
                continue;
            }
            if (input[i].substr(0, 1) === '-') {
                this._args[input[i].replace('-', '')] = input[++i];
                continue;
            }
            this._args[input[i]] = input[++i];
        }
    }

    /**
     * @returns {*}
     */
    get() {
        for (let i = 0; i < arguments.length; i++) {
            if (typeof(this._args[arguments[i]]) !== 'undefined') {
                return this._args[arguments[i]];
            }
        }
        return undefined;
    }
};
