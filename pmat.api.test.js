
const pmat = {};

pmat.api = require('./pmat.api');

console.log('pmat.api: ', pmat.api);

const testCases = pmat.api.getTestCases();


pm = {
    variables:
    {
        get:function(varName)
        {
            return true
        }

    },
    info:
    {
        iteration:0
    }
};

pmat.api.loader();


