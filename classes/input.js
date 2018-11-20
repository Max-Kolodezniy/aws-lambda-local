'use strict';

module.exports = class Input {
    static testFunction(arg) {
        return arg;
    }
    /**
     * @returns {Promise<*>}
     */
    static async get() {
        if (!process.stdin.isTTY) {
            return new Promise(resolve => {
                const stdin = process.stdin;
                let input = [];                             // Event data piped to input
                // stdin.resume();
                stdin.setEncoding('utf8');
                stdin.on('readable', () => {
                    const line = process.stdin.read();
                    if (line !== null) {
                        input.push(line);
                    } else {
                        return Promise.resolve();
                    }
                });
                stdin.on('end', () => {
                    resolve(input && input.length ? JSON.parse(input.join('')) : undefined);
                });
            })
        }
    }
};
