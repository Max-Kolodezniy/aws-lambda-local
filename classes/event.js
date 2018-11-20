'use strict';

module.exports = class Event {
    /**
     * @param {Object} event
     * @param {Object} input
     * @returns {Promise<void>}
     */
    constructor (event, input) {
        if (typeof(event) !== 'undefined') {
            const File = require('./file');
            let parsedEventData = File.resolve(event);              // Event data in filename
            if (typeof(parsedEventData) === 'undefined') {
                parsedEventData = JSON.parse(event);                // Event data is raw JSON
            }
            event = parsedEventData;
        } else {
            event = input;
        }
        if (!event) event = {};

        this._event = event;
    }

    /**
     * @returns {*}
     */
    get() {
        return this._event;
    }

    static async getBody(request) {
        return new Promise ((resolve) => {
            let body = '';
            request.on('data', chunk => {
                body += chunk.toString();
            });
            request.on('end', () => {
                resolve(body);
            });
        });
    }

    /**
     * @param {string} string
     * @returns {boolean}
     */
    static isBase64(string) {
        try {
            return btoa(atob(string)) === string;
        } catch (err) {
            return false;
        }
    }

    /**
     * @param {Object} request
     * @returns {module.Event}
     */
    static async factory(request) {
        request.url = request.url || '';
        request.httpVersion = request.httpVersion || '1.1';
        request.headers = request.headers || {};
        request.rawHeaders = request.rawHeaders || [];

        const multiValueHeaders = {};

        let headerName = null;
        request.rawHeaders.forEach((value, idx) => {
            if (idx % 2 === 0) {
                headerName = value;
            } else {
                if (headerName) {
                    if (!multiValueHeaders.hasOwnProperty(headerName)) {
                        multiValueHeaders[headerName] = [ value ];
                    } else {
                        multiValueHeaders[headerName].push(value);
                    }
                }
            }
        });

        const url = require('url');
        const inputUrl = url.parse(request.url,true);
        inputUrl.query = inputUrl.query || {};
        inputUrl.pathname = inputUrl.pathname || '';
        const pathPieces = inputUrl.pathname.split('/');
        if (pathPieces.length && pathPieces[0] === '') pathPieces.splice(0, 1);
        const stage = pathPieces.length > 1 ? pathPieces.splice(0, 1)[0] : null;
        const pathWithoutStage = '/' + pathPieces.join('/');

        const queryStringParameters = {};
        const multiValueQueryStringParameters = {};

        for (const i in inputUrl.query) {
            // noinspection JSUnfilteredForInLoop
            if (Array.isArray(inputUrl.query[i])) {
                // noinspection JSUnfilteredForInLoop
                queryStringParameters[i] = inputUrl.query[i][0];
                // noinspection JSUnfilteredForInLoop
                multiValueQueryStringParameters[i] = inputUrl.query[i];
            } else {
                // noinspection JSUnfilteredForInLoop
                queryStringParameters[i] = inputUrl.query[i];
                // noinspection JSUnfilteredForInLoop
                multiValueQueryStringParameters[i] = [ inputUrl.query[i] ];
            }
        }

        const d = new Date();

        const body = await Event.getBody(request);

        const input = {
            resource: "/{proxy+}",
            path: pathWithoutStage || 'PATH',
            httpMethod: request.method || 'UNKNOWN',
            headers: request.headers,
            multiValueHeaders: multiValueHeaders,
            queryStringParameters: queryStringParameters,
            multiValueQueryStringParameters: multiValueQueryStringParameters,
            pathParameters: {
                proxy: pathWithoutStage || 'PATH'
            },
            stageVariables: null,
            requestContext: {
                resourceId: "RESOURCE_ID",
                resourcePath: "/{proxy+}",
                httpMethod: request.method || 'UNKNOWN',
                extendedRequestId: "EXTENDED_REQ_ID",
                requestTime: d.toGMTString(),
                path: inputUrl.pathname,
                accountId: "123456789012",
                protocol: 'HTTP/' + request.httpVersion,
                stage: stage || 'STAGE',
                domainPrefix: "API_ID",
                requestTimeEpoch: d.getTime()/1000,
                requestId: "8aaaaaaa-4bbb-4ccc-4ddd-12eeeeeeeeee",
                identity: {
                    cognitoIdentityPoolId: null,
                    accountId: null,
                    cognitoIdentityId: null,
                    caller: null,
                    sourceIp: "127.0.0.1",
                    accessKey: null,
                    cognitoAuthenticationType: null,
                    cognitoAuthenticationProvider: null,
                    userArn: null,
                    userAgent: request.headers['user-agent'] || '',
                    user: null,
                },
                domainName: "API_ID.execute-api.us-west-1.amazonaws.com",
                apiId: "API_ID",
            },
            body: body,
            isBase64Encoded: Event.isBase64(body),
        };

        return new this(undefined, input);
    }
};
