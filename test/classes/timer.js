'use strict';

const assert = require('assert');
const mock = require('sinon');
const expect = require('chai').expect;
const Timer = require('../../classes/timer');

describe('Timer class test suite', () => {
    it('Should return Timeout object', () => {
        const timeout = 1;
        const timer = new Timer(timeout);
        const timerObject = timer.get();
        expect(timerObject).to.have.property('_idleTimeout');
        expect(timerObject).to.have.property('_idleTimeout').equal(timeout * 1000);
        timer.stop();
    });

    it('Should throw exception on timer end', function (done) {
        const timeout = 0.001;
        this.timeout(200);
        const timer = new Timer(timeout);
        const exceptionMock = mock.stub(timer, 'throwError');
        setTimeout(() => {
            expect(exceptionMock.callCount).to.equal(1);
            exceptionMock.restore();
            done();
        }, timeout * 1000);
    });

    it('Should have ability to be stopped', function (done) {
        const timeout = 0.001;
        this.timeout(200);
        const timer = new Timer(timeout);
        timer.stop();
        const exceptionMock = mock.stub(timer, 'throwError');
        setTimeout(() => {
            const timerObject = timer.get();
            expect(timerObject).to.have.property('_idleTimeout');
            expect(timerObject).to.have.property('_idleTimeout').equal(-1);
            expect(timerObject).to.have.property('_idlePrev');
            expect(timerObject).to.have.property('_idlePrev').to.be.null;
            expect(timerObject).to.have.property('_idleNext');
            expect(timerObject).to.have.property('_idleNext').to.be.null;
            expect(exceptionMock.callCount).to.equal(0);
            exceptionMock.restore();
            done();
        }, timeout * 1000);
    });

    it('Test the throwError method', () => {
        const timeout = 0.001;
        const timer = new Timer(timeout);
        timer.stop();
        expect(timer.throwError.bind(timer)).to.throw(Error);
    });
});
