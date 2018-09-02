
const pmat = {};

pmat.api = require('./pmat.api');

const testCases = pmat.api.getTestCases();

try {
    pmat.api.loader();
} catch (e) {
    console.log('failed to execute pmat.api.loader: exception name: ' + e.name + ' message: ' + e.message);

    pm.test('Critital ERROR!!!! There have been exceptions... take a look to the console logs to see them...',
        function () {
            pm.expect(0).to.equal(1);
        }
    );
    //postman.setNextRequest('pmat-end');
}

export const testCases = testCases;