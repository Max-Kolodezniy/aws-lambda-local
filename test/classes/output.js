'use strict';

const assert = require('assert');
const sinon = require('sinon');
const expect = require('chai').expect;
const Output = require('../../classes/output');

describe('Output module test suite', () => {
    afterEach(() => {
        sinon.restore();
    });

    describe('Abstract Output class test suite', () => {
        it('Should output to console', () => {
            const what = 'any output';
            const consoleMock = sinon.mock(console);
            consoleMock.expects('log').once().withExactArgs(what);

            const outputObject = new Output.Output();
            outputObject.dumpOutput(what);
            consoleMock.restore();
            consoleMock.verify();
        });

        it('Should output errors to console.error (stderr)', () => {
            const what = 'any output';
            const consoleMock = sinon.mock(console);
            consoleMock.expects('error').once().withExactArgs(what);

            const outputObject = new Output.Output();
            outputObject.dumpError(what);
            consoleMock.verify();
            consoleMock.restore();
        });
    });

    describe('CLI Output class test suite', () => {
        it('Should output to console raw text as is', () => {
            const what = 'any output';
            const consoleMock = sinon.mock(console);

            consoleMock.expects('log').withExactArgs('OUTPUT');
            consoleMock.expects('log').withExactArgs('--------------------------------');
            consoleMock.expects('log').withExactArgs(what);

            // super class methods stub doesn't work. Leave if for now.
            // const superStub = sinon.stub(outputObject.prototype, 'dumpOutput');
            // superStub.withExactArgs(what);

            const outputObject = new Output.CLI();
            outputObject.dumpOutput(what);
            consoleMock.restore();
            consoleMock.verify();
        });

        it('Should output beautified JSON to console', () => {
            const what = { a : 'b' };
            const consoleMock = sinon.mock(console);

            consoleMock.expects('log').withExactArgs('OUTPUT');
            consoleMock.expects('log').withExactArgs('--------------------------------');
            consoleMock.expects('log').withExactArgs(JSON.stringify(what, null, 4));

            const outputObject = new Output.CLI();
            outputObject.dumpOutput(what);
            consoleMock.restore();
            consoleMock.verify();
        });

        it('Should output simple error message to console', () => {
            const errorObject = { errorMessage: 'error message' };
            const consoleMock = sinon.mock(console);

            consoleMock.expects('error').withExactArgs('ERROR');
            consoleMock.expects('error').withExactArgs('--------------------------------');
            consoleMock.expects('error').withExactArgs(JSON.stringify(errorObject, null, 4));

            const outputObject = new Output.CLI();
            outputObject.dumpError(errorObject.errorMessage);
            consoleMock.restore();
            consoleMock.verify();
        });

        it('Should output simple error object to console', () => {
            const errorObject = { errorMessage: 'error message' };
            const consoleMock = sinon.mock(console);

            consoleMock.expects('error').withExactArgs('ERROR');
            consoleMock.expects('error').withExactArgs('--------------------------------');
            consoleMock.expects('error').withExactArgs(JSON.stringify(errorObject, null, 4));

            const outputObject = new Output.CLI();
            outputObject.dumpError(errorObject);
            consoleMock.restore();
            consoleMock.verify();
        });

        it('Should output type Error to console', () => {
            const message = 'error message';
            const errorObject = new Error(message);
            const consoleMock = sinon.mock(console);

            const outputObject = new Output.CLI();

            consoleMock.expects('error').withExactArgs('ERROR');
            consoleMock.expects('error').withExactArgs('--------------------------------');
            consoleMock.expects('error').withExactArgs(JSON.stringify(outputObject.prepareError(errorObject), null, 4));

            outputObject.dumpError(errorObject);
            consoleMock.restore();
            consoleMock.verify();
        });

        it('Should prepare Error object properly', () => {
            const message = 'error message';
            const errorObject = new Error(message);
            const outputObject = new Output.CLI();
            const prepared = outputObject.prepareError(errorObject);
            expect(prepared).to.be.an('object');
            expect(prepared).to.have.property('errorMessage').equal(message);
            expect(prepared).to.have.property('errorType').equal('Error');
            expect(prepared).to.have.property('stackTrace');
        });

        it('Should have Error Message for empty Error', () => {
            const errorObject = new Error();
            const outputObject = new Output.CLI();
            const prepared = outputObject.prepareError(errorObject);
            expect(prepared).to.be.an('object');
            expect(prepared).to.have.property('errorMessage').equal('null');
            expect(prepared).to.have.property('errorType').equal('Error');
            expect(prepared).to.have.property('stackTrace');
        });

        it('Should output type other than Error to console', () => {
            const message = 'error message';
            class TestError extends Error {
                constructor(message) {
                    super(message);
                }
            }
            const errorObject = new TestError(message);
            const consoleMock = sinon.mock(console);

            consoleMock.expects('error').withExactArgs('ERROR');
            consoleMock.expects('error').withExactArgs('--------------------------------');
            consoleMock.expects('error').withExactArgs(JSON.stringify(errorObject, null, 4));

            const outputObject = new Output.CLI();
            outputObject.dumpError(errorObject);
            consoleMock.restore();
            consoleMock.verify();
        });
    });

    describe('APIGW Output class test suite', () => {
        it('Should output any kind of raw body', () => {
            const what = 'any output';
            const headers = { 'Content-Length' : what.length };
            const responseReceiver = { writeHead : () => {}, end : () => {} };
            const writeHeadStub = sinon.stub(responseReceiver, 'writeHead');
            const endStub = sinon.stub(responseReceiver, 'end');

            const outputObject = new Output.APIGW(responseReceiver);
            outputObject.dumpOutput(what);

            sinon.assert.calledWithMatch(writeHeadStub, 200, headers);
            sinon.assert.calledWithMatch(endStub, what);

            assert(writeHeadStub.calledOnce);
            assert(endStub.calledOnce);
            assert(writeHeadStub.calledBefore(endStub));
        });

        it('Should output arrays', () => {
            const what = [1,2];
            const headers = { 'Content-Length' : JSON.stringify(what).length };
            const responseReceiver = { writeHead : () => {}, end : () => {} };
            const writeHeadStub = sinon.stub(responseReceiver, 'writeHead');
            const endStub = sinon.stub(responseReceiver, 'end');

            const outputObject = new Output.APIGW(responseReceiver);
            outputObject.dumpOutput(what);

            sinon.assert.calledWithMatch(writeHeadStub, 200, headers);
            sinon.assert.calledWithMatch(endStub, JSON.stringify(what));

            assert(writeHeadStub.calledOnce);
            assert(endStub.calledOnce);
            assert(writeHeadStub.calledBefore(endStub));
        });

        it('Should output simple object', () => {
            const what = { a : 'b' };
            const whatString = JSON.stringify(what);
            const headers = { 'Content-Length' : whatString.length, 'Content-Type' : 'application/json; charset=utf-8' };
            const responseReceiver = { writeHead : () => {}, end : () => {} };
            const writeHeadStub = sinon.stub(responseReceiver, 'writeHead');
            const endStub = sinon.stub(responseReceiver, 'end');

            const outputObject = new Output.APIGW(responseReceiver);
            outputObject.dumpOutput(what);

            sinon.assert.calledWithMatch(writeHeadStub, 200, headers);
            sinon.assert.calledWithMatch(endStub, whatString);

            assert(writeHeadStub.calledOnce);
            assert(endStub.calledOnce);
            assert(writeHeadStub.calledBefore(endStub));
        });

        it('Should output API_Gateway compatible object', () => {
            const what = {
                statusCode : 777,
                headers : { any : 'header', controlled : 'by lambda' },
                body : JSON.stringify({ a : 'b' })
            };
            const headers = { 'Content-Length' : what.body.length, ...what.headers };
            const responseReceiver = { writeHead : () => {}, end : () => {} };
            const writeHeadStub = sinon.stub(responseReceiver, 'writeHead');
            const endStub = sinon.stub(responseReceiver, 'end');

            const outputObject = new Output.APIGW(responseReceiver);
            outputObject.dumpOutput(what);

            sinon.assert.calledWithMatch(writeHeadStub, what.statusCode, headers);
            sinon.assert.calledWithMatch(endStub, what.body);

            assert(writeHeadStub.calledOnce);
            assert(endStub.calledOnce);
            assert(writeHeadStub.calledBefore(endStub));
        });

        it('Should return error if payload is more than 6M', () => {
            const body = 'string'.repeat(1024 * 1024 + 1);
            const what = {
                statusCode : 777,
                headers : { any : 'header', controlled : 'by lambda' },
                body : body
            };
            const headers = { 'Content-Type' : 'application/json; charset=utf-8' };
            const responseReceiver = { writeHead : () => {}, end : () => {} };
            const writeHeadStub = sinon.stub(responseReceiver, 'writeHead');
            const endStub = sinon.stub(responseReceiver, 'end');

            const outputObject = new Output.APIGW(responseReceiver);
            outputObject.dumpOutput(what);

            sinon.assert.calledWithMatch(writeHeadStub, 502, headers);
            sinon.assert.calledWithMatch(endStub, '{"Error":"Lambda Payload size limit reached (6M)"}');

            assert(writeHeadStub.calledOnce);
            assert(endStub.calledOnce);
            assert(writeHeadStub.calledBefore(endStub));
        });
    });
});
