'use strict';

module.exports = class File {
    /**
     * @param {string} file
     * @returns {*}
     */
    static resolve(file) {
        const path = require('path');
        if (file.substr(-5) !== '.json') file += '.json';
        file = path.resolve(file);
        if (!(require('fs')).existsSync(file)) {
            throw new Error(`Cannot find module '${file}'`);
        }
        file = require.resolve(file);
        file = require(file);
        if (typeof(file) === 'string') file = JSON.parse(file);
        return file;
    }
};
