#!/usr/bin/env node
'use strict';

const Args      = require('./classes/args');
const File      = require('./classes/file');
const Input     = require('./classes/input');
const Output    = require('./classes/output');
const Event     = require('./classes/event');
const Timer     = require('./classes/timer');
const Context   = require('./classes/context');
const Function  = require('./classes/function');

(async () => {
    try {
        const args = new Args(process.argv.slice(2));
        const port = args.get('p', 'port', 'api-port');

        if (!port) {
            const output = new Output.CLI();
            const context = new Context(args.get('c', 'context'), output);
            const timer = new Timer(args.get('t', 'timeout'));
            const input = await Input.get();
            const event = new Event(args.get('e', 'event'), input);
            const lambda = new Function(
                args.get('f', 'function')
                , args.get('h', 'handler')
                , event
                , context
                , timer
            );
            lambda.run().then(() => process.exit());
        } else {
            const http = require('http');

            const server = http.createServer(async (request, response) => {
                const output = new Output.APIGW(response);
                const context = new Context(args.get('c', 'context'), output);
                const timer = new Timer(args.get('t', 'timeout'));
                const event = await Event.factory(request);
                const lambda = new Function(
                    args.get('f', 'function')
                    , args.get('h', 'handler')
                    , event
                    , context
                    , timer
                );

                console.log(event.get().requestContext.requestTime + '    ' + event.get().requestContext.path);
                lambda.run().then(() => {
                    console.log('--------------------------------')
                });
            });
            server.on('clientError', (err, socket) => {
                socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            });
            server.listen(port);
        }
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
})();
