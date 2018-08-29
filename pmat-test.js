
let {pmat} = require('./pmat');
let {testCases} = require('./pmat');

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


