'use strict';

class Output {
    /**
     * @param {Object|string} output
     */
    dumpOutput (output) {
        console.log(output);
    }

    /**
     * @param {Object|string} error
     */
    dumpError (error) {
        console.error(error);
    }
}

class CLI extends Output {
    /**
     * @param {Object|string} output
     */
    dumpOutput (output) {
        if (Object.prototype.toString.call(output) === '[object Object]') {
            if (output.isBase64Encoded && output.body) {
                output.body = Buffer.from(output.body, 'base64')
            }
            output = JSON.stringify(output, null, 4);
        }
        console.log('OUTPUT');
        console.log('--------------------------------');
        super.dumpOutput(output);
    }

    /**
     * @param {Object|string} error
     */
    dumpError (error) {
        console.error('ERROR');
        console.error('--------------------------------');
        let output = '';
        if (typeof(error) === 'object') {
            if (error.constructor.name === 'Error') {
                output = JSON.stringify(this.prepareError(error), null, 4);
            } else {
                output = JSON.stringify(error, null, 4);
            }
        } else {
            output = JSON.stringify({errorMessage: error}, null, 4);
        }
        super.dumpError(output);
    }

    /**
     * @param {Error} error
     */
    prepareError(error) {
        return {
            errorMessage: error.message ? error.message : 'null',
            errorType: error.constructor.name,
            stackTrace: error.stack
        }
    }
}

class APIGW extends CLI {
    constructor(response) {
        super();
        this._response = response;
    }
    /**
     * @param {Object} output
     * @param {Number} output.statusCode
     * @param {Object} output.headers
     * @param {String} output.body
     */
    dumpOutput (output) {
        // string or simple JSON?
        if (typeof(output) !== 'object') {
            output = {
                statusCode : 200,
                headers : {},
                body : typeof(output) !== 'string' ? JSON.stringify(output) : output
            };
        } else if (!(output.statusCode && output.headers && output.body)) {
            output = {
                statusCode : 200,
                headers : {},
                body : JSON.stringify(output)
            };
            if (!output.headers['Content-Type'] && !output.headers['content-type']) {
                output.headers['Content-Type'] = 'application/json; charset=utf-8';
            }
        }

        if (output.isBase64Encoded && output.body) {
            output.body = Buffer.from(output.body, 'base64')
        }

        const contentLength = Buffer.byteLength(output.body);
        output.headers['Content-Length'] = contentLength;
        if (contentLength > 6291456) {  // 6*1024*1024=6M
            output = {
                statusCode : 502,
                headers : { 'Content-Type' : 'application/json; charset=utf-8' },
                body : '{"Error":"Lambda Payload size limit reached (6M)"}'
            };
        }

        this._response.writeHead(output.statusCode, output.headers);
        this._response.end(output.body);
    }
}

module.exports = {
    Output : Output,
    CLI : CLI,
    APIGW : APIGW
};
