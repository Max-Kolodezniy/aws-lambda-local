'use strict';

const assert = require('assert');
const expect = require('chai').expect;
const sinon = require('sinon');
const Input = require('../../classes/input');

describe('Input class test suite', () => {
    it('Test get piped input', (done) => {
        const isTTY = process.stdin.isTTY;
        process.stdin.isTTY = false;

        const stdinMock = sinon.mock(process.stdin);
        stdinMock.expects('read').atLeast(1).returns('{"a":"b"}');
        stdinMock.expects('setEncoding').once().withArgs('utf8');

        Input.get().then(input => {
            expect(input).to.be.an('object');
            expect(input).to.have.property('a').equal('b');
            stdinMock.restore();
            stdinMock.verify();
            done();
        });

        process.stdin.emit('readable');
        process.stdin.emit('end');
        process.stdin.isTTY = isTTY;
    });

    it('Test empty piped input', (done) => {
        const isTTY = process.stdin.isTTY;
        process.stdin.isTTY = false;

        const stdinMock = sinon.mock(process.stdin);
        stdinMock.expects('read').atLeast(1).returns(null);
        stdinMock.expects('setEncoding').once().withArgs('utf8');

        Input.get().then(input => {
            expect(input).to.be.undefined;
            stdinMock.restore();
            stdinMock.verify();
            done();
        });

        process.stdin.emit('readable');
        process.stdin.emit('end');
        process.stdin.isTTY = isTTY;
    });

    it('Test no input if invocation is not piped', async () => {
        const isTTY = process.stdin.isTTY;
        process.stdin.isTTY = true;
        const input = await Input.get();
        expect(input).to.be.undefined;
        process.stdin.isTTY = isTTY;
    });

    it('Test TDD case', async () => {
        const argument = true;
        const result = await Input.testFunction(argument);
        expect(result).to.equal(argument);
    });
});
