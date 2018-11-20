'use strict';

const Context = require('./context');

module.exports = class Function {
    /**
     * @param {string} name
     * @param {string} handler
     * @param {Event} event
     * @param {Context} context
     * @param {Timer} timer
     */
    constructor(name, handler, event, context, timer) {
        this._timer = timer;
        if (typeof(name) === 'undefined') {
            throw new Error('Invalid function name. It should be accessible from invocation place');
        }
        const path = require('path');
        this._basename = path.basename(name);

        try {
            if (name.substr(-3) !== '.js') name += '.js';
            name = path.resolve(name);
        } catch (e) {
            throw new Error('Cannot resolve given function ' + name);
        }
        context.functionName = this._basename;
        this._name = name;
        this._handler = handler;
        this._event = event;
        this._context = context;
    }

    /**
     * @returns {*}
     * @private
     */
    _getHandler() {
        const exported = require(this._name);
        if (this._handler) {
            if (exported.hasOwnProperty(this._handler) && typeof(exported[this._handler]) === 'function') {
                return exported[this._handler];
            }
            throw new Error('Cannot resolve given function ' + this._name + '.' + this._handler);
        }
        for (let property in exported) {
            if (exported.hasOwnProperty(property) && typeof(exported[property]) === 'function') {
                return exported[property];
            }
        }
        throw new Error(this._name + ' doesn\'t contain any callable');
    }

    /**
     * @returns {*}
     */
    run() {
        const result = this._getHandler().call({}, this._event.get(), this._context.get(), function (error, output) {
            if (typeof(error) !== 'undefined' && error !== null) {                      // Normal callback call
                this._context.fail(error);
                this._timer.stop();
            }
            if (typeof(output) === 'undefined') output = null;
            this._context.succeed(output);
            this._timer.stop();
        });
        if (typeof(result) !== 'undefined' && typeof(result.then) === 'function') {     // Promise returned or async function
            return result
                .then((output) => {
                    this._context.succeed(output);
                    this._timer.stop();
                })
                .catch((err) => {
                    console.log(err);
                    this._context.fail(err);
                    this._timer.stop();
                })
        }
        return Promise.resolve();
    }
};
