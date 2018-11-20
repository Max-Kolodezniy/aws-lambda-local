'use strict';

module.exports = class Context {
    /**
     * @param {Object|undefined} context
     * @param {Output} output
     */
    constructor(context, output) {
        if (typeof(context) !== 'undefined') context = File.resolve(context);
        if (!context) {
            const hash = (Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2)).substr(0, 32);
            context = {
                callbackWaitsForEmptyEventLoop: true,
                logGroupName: '/aws/lambda/functionName',
                logStreamName: (new Date()).toISOString().substr(0, 10).replace(/-/g, '/') + '/[$LATEST]' + hash,
                functionName : 'functionName',
                memoryLimitInMB: '128',
                functionVersion: '$LATEST',
                invokeId: [
                    hash.substr(0, 8), hash.substr(8, 4), hash.substr(12, 4), hash.substr(16, 4), hash.substr(20, 12)
                ].join('-'),
                awsRequestId : '',
                invokedFunctionArn: 'arn:aws:lambda:aws-region:1234567890123:function:functionName'
            };
            context.awsRequestId = context.invokeId;
        }

        this._context = context;
        this._output = output;
        this._context.succeed = this.succeed;
        this._context.done = this.done;
        this._context.fail = this.fail;
    }

    /**
     * @param {string} name
     */
    set functionName (name) {
        this._context.functionName = name;
        this._context.logGroupName = '/aws/lambda/' + name;
        this._context.invokedFunctionArn = 'arn:aws:lambda:aws-region:1234567890123:function:' + name;
    }

    /**
     * @returns {*|Object}
     */
    get() {
        return this._context;
    }

    /**
     * @param {Object|string} error
     * @param {Object|string} message
     */
    done (error, message) {
        if (error) {
            this._output.dumpError(error);
        }
        this._output.dumpOutput(message);
    }

    /**
     * @param {Object|string} output
     */
    succeed (output) {
        this._output.dumpOutput(output);
    }

    /**
     * @param {Object|string} error
     */
    fail (error) {
        this._output.dumpError(error);
    }
};
