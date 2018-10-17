//@deleteNextLine
const pmat = {}


//@deleteNextLine
const pm = require('./pm')

//@deleteNextLine
pmat.api = require('./pmat.api')

const testCases = pmat.api.getTestCases()
pm.variables.set('testCases', testCases)

//@deleteNextLine
const unitTest = require('./unitTest')

let unitTestMode = true

try{
    unitTest
}catch(e)
{
    unitTestMode = false
}

try {
    if(!unitTestMode) pmat.api.loader()
} catch (e) {
    console.log(e.stack)
    console.log('failed to execute pmat.api.loader: exception name: ' + e.name + ' message: ' + e.message)
    console.log('testCases: ', testCases)

    pm.test('Critital ERROR!!!! There have been exceptions... take a look to the console logs to see them...',
        function () {
            pm.expect(0).to.equal(1)
        }
    )
    //postman.setNextRequest('pmat-end')
}

(
    function() { return pmat}
)()

//@deleteNextLine
module.exports = testCases

