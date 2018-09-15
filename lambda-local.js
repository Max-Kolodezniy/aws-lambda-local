#!/usr/bin/env node
'use strict';

(async () => {
    try {
        const path = require('path');

        if (typeof(String.prototype.repeat) !== 'function') {
            String.prototype.repeat = (len) => {
                return new Array(len + 1).join(this);
            }
        }

// Parse args
        let args = {};
        const raw = process.argv.slice(2);
        for (let i = 0; i < raw.length; i++) {
            if (raw[i].substr(0, 2) === '--' && raw[i].indexOf('=') !== -1) {
                raw[i] = raw[i].split('=');
                args[raw[i][0].replace('--', '')] = raw[i].slice(1).join('=');
                continue;
            }
            if (raw[i].substr(0, 2) === '--') {
                args[raw[i].replace('--', '')] = raw[++i];
                continue;
            }
            if (raw[i].substr(0, 1) === '-') {
                args[raw[i].replace('-', '')] = raw[++i];
                continue;
            }
            args[raw[i]] = raw[++i];
        }

// If there is no function - exit;
        let name = args.f || args.function;
        if (typeof(name) === 'undefined') {
            console.log('Invalid function name. It should be accessible from invocation place');
            process.exit(1);
        }
        const basename = path.basename(name);

// Function path recognition
        try {
            if (name.substr(-3) !== '.js') name += '.js';
            name = path.resolve(name);
        } catch (e) {
            console.log('Cannot resolve given function ' + name);
            process.exit(1);
        }

        const resolve = (file) => {
            try {
                if (file.substr(-5) !== '.json') file += '.json';
                file = path.resolve(file);
                file = require.resolve(file);
                file = require(file);
                if (typeof(file) === 'string') file = JSON.parse(file);
                return file;
            } catch (e) {
            }
            return undefined;
        };

// Resolve event object
        let event = args.e || args.event;
        if (typeof(event) !== 'undefined') {
            let parsedEventData = resolve(event);               // Event data in filename
            if (typeof(parsedEventData) === 'undefined') {
                try {
                    parsedEventData = JSON.parse(event);        // Event data is raw JSON
                } catch (e) {
                    console.error(e);
                    process.exit();
                }
            }
            event = parsedEventData;
        } else {
            let getInput = () => {
                return new Promise(resolve => {
                    let input = [];                                     // Event data piped to input
                    const stdin = process.stdin;
                    stdin.resume();
                    stdin.setEncoding('utf8');
                    stdin.on('data', (line) => {
                        input.push(line);
                    });
                    stdin.on('end', () => {
                        resolve(JSON.parse(input.join('')));
                    });
                })
            };
            event = await getInput();
        }
        if (!event) event = {};

// if input argument Context exists - use it
        let context = args.c || args.context;
        if (typeof(context) !== 'undefined') context = resolve(context);
        if (!context) {
            const hash = (Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2)).substr(0, 32);
            context = {
                awsRequestId: [
                    hash.substr(0, 8), hash.substr(8, 4), hash.substr(12, 4), hash.substr(16, 4), hash.substr(20, 12)
                ].join('-'),
                logGroupName: '/aws/lambda/' + basename,
                logStreamName: (new Date()).toISOString().substr(0, 10).replace(/-/g, '/') + '/[$LATEST]' + hash,
                functionName: basename,
                memoryLimitInMB: '128',
                functionVersion: '$LATEST',
                invokedFunctionArn: 'arn:aws:lambda:aws-region:1234567890123:function:' + basename
            };
            context.invokeId = context.awsRequestId;
        }
        context._dumpOutput = function (output) {
            if (Object.prototype.toString.call(output) === '[object Object]') output = JSON.stringify(output, null, 4);
            console.log('OUTPUT');
            console.log('-'.repeat(32));
            console.log(output);
        };
        context._dumpError = function (error) {
            console.log('ERROR');
            console.log('-'.repeat(32));
            if (typeof(error) === 'object') {
                if (error.constructor.name === 'Error') {
                    console.log(JSON.stringify({
                        errorMessage: error.message ? error.message : 'null',
                        errorType: error.constructor.name,
                        stackTrace: error.stack
                    }, null, 4));
                } else {
                    console.log(JSON.stringify(error, null, 4));
                }
            } else {
                console.log(JSON.stringify({errorMessage: error}, null, 4));
            }
        };
        context.done = function (error, message) {
            if (error) {
                this._dumpError(error);
                console.log();
            }
            this._dumpOutput(message);
            exitTimer.unref();
            process.exit();
        };
        context.succeed = function (output) {
            this._dumpOutput(output);
            exitTimer.unref();
            process.exit();
        };
        context.fail = function (error) {
            this._dumpError(error);
            exitTimer.unref();
            process.exit(1);
        };

        var timeout = args.t || args.timeout || 30;
        var exitTimer = setTimeout(function () {
            console.log('Lambda function ' + basename + ' was timed out after ' + timeout + ' seconds');
            process.exit(1);
        }, timeout * 1000);

        var getHandler = function (filename) {
            var exported = require(filename);
            if (args.h || args.handler) {
                const handler = args.h || args.handler;
                if (exported.hasOwnProperty(handler) && typeof(exported[handler]) === 'function') {
                    return exported[handler];
                }
                console.log('Cannot resolve given function ' + name + '.' + handler);
                process.exit(1);
            }
            for (let property in exported) {
                if (exported.hasOwnProperty(property) && typeof(exported[property]) === 'function') {
                    return exported[property];
                }
            }
            console.log(name + ' doesn\'t contain any callable');
            process.exit(1);
        };

        const result = getHandler(name).call({}, event, context, function (error, output) {
            if (typeof(error) !== 'undefined' && error !== null) {                      // Normal callback call
                context.fail(error);
            }
            if (typeof(output) === 'undefined') output = null;
            context.succeed(output);
        });
        if (typeof(result) !== 'undefined' && typeof(result.then) === 'function') {     // Promise returned or async function
            result
                .then((output) => {
                    context.succeed(output)
                })
                .catch((err) => {
                    context.fail(err)
                })
        }

        exitTimer.unref();
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
})();
