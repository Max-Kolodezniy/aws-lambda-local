#!/usr/bin/env node
'use strict';

var path = require('path');

if (typeof(String.prototype.repeat) !== 'function') {
    String.prototype.repeat = function( len )
    {
        return new Array( len + 1 ).join( this );
    }
}

// Parse args
var args = {};
var raw = process.argv.slice(2);
for (var i = 0; i < raw.length; i++) {
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
var name = args.f || args.function;
if (typeof(name) === 'undefined') {
    console.log('Invalid function name. It should be accessible from invocation place');
    process.exit(1);
}
var basename = path.basename(name);

// Function path recognition
try {
    if (name.substr(-3) !== '.js') name += '.js';
    name = path.resolve(name);
} catch (e) {
    console.log('Cannot resolve given function ' + name);
    process.exit(1);
}

var resolve = function(file) {
    try {
        if (file.substr(-5) !== '.json') file += '.json';
        file = path.resolve(file);
        file = require.resolve(file);
        file = require(file);
        if (typeof(file) === 'string') file = JSON.parse(file);
        return file;
    } catch (e) {}
    return undefined;
};

// Resolve event object
var event = args.e || args.event;
if (typeof(event) !== 'undefined') event = resolve(event);
if (!event) event = {};

// if input argument Context exists - use it
var context = args.c || args.context;
if (typeof(context) !== 'undefined') context = resolve(context);
if (!context) {
    var hash = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    context = {
        awsRequestId    : [
            hash.substr(0, 8), hash.substr(9, 4), hash.substr(12, 4), hash.substr(16, 4), hash.substr(20, 12)
        ].join('-'),
        logGroupName    : '/aws/lambda/' + basename,
        logStreamName   : (new Date()).toISOString().substr(0, 10).replace(/-/g, '/') + '/[$LATEST]' + hash,
        functionName    : basename,
        memoryLimitInMB : '128',
        functionVersion : '$LATEST',
        invokedFunctionArn : 'arn:aws:lambda:aws-region:1234567890123:function:' + basename
    };
    context.invokeId = context.awsRequestId;
}
context._dumpOutput = function(output)
{
    if (Object.prototype.toString.call(output) === '[object Object]') output = JSON.stringify(output, null, 4);
    console.log('OUTPUT');
    console.log('-'.repeat(32));
    console.log(output);
};
context._dumpError = function(error)
{
    console.log('ERROR');
    console.log('-'.repeat(32));
    if (typeof(error) === 'object') {
        if (error.constructor.name == 'Error') {
            console.log(JSON.stringify({
                errorMessage : error.message ? error.message : 'null',
                errorType    : error.constructor.name,
                stackTrace   : error.stack
            }, null, 4));
        } else {
            console.log(JSON.stringify(error, null, 4));
        }
    } else {
        console.log(JSON.stringify({ errorMessage : error }, null, 4));
    }
};
context.done = function(error, message)
{
    if (error) {
        this._dumpError(error);
        console.log();
    }
    this._dumpOutput(message);
    process.exit();
};
context.succeed = function(output)
{
    this._dumpOutput(output);
    process.exit();
};
context.fail = function(error)
{
    this._dumpError(error);
    process.exit();
};

var timeout = args.t || args.timeout || 30;
var exitTimer = setTimeout(function() {
    console.log('Lambda function ' + basename + ' was timed out after ' + timeout + ' seconds');
    process.exit(1);
}, timeout*1000);

var getHandler = function(filename) {
    var exported = require(filename);
    for (var property in exported) {
        if (exported.hasOwnProperty(property) && typeof(exported[property]) === 'function') {
            return exported[property];
        }
    }
    process.exit();
};

if (parseInt((process.version.replace('v', '').replace(/\./g, '') + '00000').substring(0, 5)) >= 43000) {
    var callbackCallFlag = false;
    getHandler(name).call({}, event, context, function(error, output) {
        if (callbackCallFlag) return;
        if (typeof(error) !== 'undefined' && error !== null) {
            context._dumpError(error);
        }
        if (typeof(output) === 'undefined') output = null;
        context._dumpOutput(output);
        callbackCallFlag = true;
    });
} else {
    getHandler(name).call({}, event, context);
}
exitTimer.unref();
