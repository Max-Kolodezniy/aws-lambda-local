'use strict';

const assert = require('assert');
const expect = require('chai').expect;
const should = require('chai').should;
const Args = require('../../classes/args');

describe('Args class test suite', () => {
    it('Should parse long arguments with values divided by =', () => {
        const input = '--long=argument --with=value'.split(' ');
        const args = new Args(input);
        expect(args.get('long')).to.equal('argument');
        expect(args.get('with')).to.equal('value');
    });

    it('Should parse long arguments with values divided by space', () => {
        const input = '--long argument -with value'.split(' ');
        const args = new Args(input);
        expect(args.get('long')).to.equal('argument');
        expect(args.get('with')).to.equal('value');
    });

    it('Should parse short arguments with values divided by space', () => {
        const input = '--l argument -w value'.split(' ');
        const args = new Args(input);
        expect(args.get('l')).to.equal('argument');
        expect(args.get('w')).to.equal('value');
    });

    it('Should get any option without -- or -', () => {
        const input = 'long argument with value'.split(' ');
        const args = new Args(input);
        expect(args.get('long')).to.equal('argument');
        expect(args.get('with')).to.equal('value');
    });

    it('Should return alternate arguments', () => {
        const input = '--long argument -w value'.split(' ');
        const args = new Args(input);
        expect(args.get('any', 'long')).to.equal('argument');
        expect(args.get('any', 'w')).to.equal('value');
    });

    it('Should return undefined for unknown argument key', () => {
        const input = '--long argument -w value'.split(' ');
        const args = new Args(input);
        // noinspection BadExpressionStatementJS
        expect(args.get('any')).to.be.undefined;
    });
});
