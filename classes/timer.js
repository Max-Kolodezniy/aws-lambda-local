'use strict';

module.exports = class Timer {
    /**
     * @param {int} timeout
     * @returns {number | Object}
     */
    constructor(timeout) {
        timeout = timeout || 30;
        this._timeout = timeout;
        this._timer = setTimeout(() => {
            this.throwError();
        }, timeout * 1000);
    }

    /**
     * @returns {Object}
     */
    get() {
        return this._timer;
    }

    /**
     * @returns void
     */
    stop() {
        clearTimeout(this._timer);
    }

    throwError() {
        throw new Error('Lambda function was timed out after ' + this._timeout + ' seconds');
    }
};
