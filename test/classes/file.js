'use strict';

const assert = require('assert');
const expect = require('chai').expect;
const File = require('../../classes/file');
const sampleJson = 'test/sample.json';

describe('File class test suite', () => {
    it('Should return JSON object from file by given path', () => {
        const content = File.resolve(sampleJson);
        expect(content).to.be.an('object');
        expect(content).to.have.property('sample').equal('json');
    });

    it('Should return JSON object from file by given path even without .json extension', function () {
        const content = File.resolve(sampleJson.replace('.json', ''));
        expect(content).to.be.an('object');
        expect(content).to.have.property('sample').equal('json');
    });

    it('Should throw an exception if file was not found', () => {
        expect(() => { File.resolve('unknown/file/path/here')}).to.throw(Error);
    });
});
