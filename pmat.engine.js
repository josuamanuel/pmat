
let _ = require('lodash')

//@deleteNextLine
const pmat={}
//@deleteNextLine
const pm = require('./pm')
//@deleteNextLine
const testCases = require('./pmat.main')
//@deleteNextLine
pmat.util = require('./pmat.util')



pmat.engine = {
    newRun: function () {
        let testCasesEnvironment

        try {

            //Iterate through gloablas to find variables that will compose the runtime testCases.
            testCasesEnvironment = pmat.engine.getEnvironmentVariables('testCase_', 'testConditions')
            //console.log('testCasesEnvironment',testCasesEnvironment)
            // Set testCases initializing index and iteration
            pmat.engine.setTestCases(testCasesEnvironment)

            //Before initializing something we will save a backup...
            pmat.engine.backUpTests()

            if (testCases.recordIni) pmat.engine.initTestCasesRecordRelated()

        } catch (e) {
            console.log('pmat.engine.newRun: testCases format is not correct: ' + e)
            throw e
        }
    },
    getEnvironmentVariablesDoc: 'having a list of variables names, it finds them in environment and return object with all values',
    getEnvironmentVariables: function (...listOfNameVar) {
        const NUMEROS = /^\d+$/

        let objFinal = {}
        let key_parts = []
        let varNameId

        let environment = pm.environment.values.toJSON()
        //console.log(environment)

        if (!environment) return null

        for (let i = 0, j = environment.length; i < j; i++) {

            key_parts = pmat.engine.splitInTwoFindPrefixes(environment[i].key, ...listOfNameVar)

            //key_parts = environment[i].key.split('_')

            //console.log('key_parts: ', key_parts)
            if (key_parts && key_parts.length === 2 && key_parts[0].slice(-1) === '_' && key_parts[1].match(NUMEROS)) {
                //remove last '_' from string.
                varNameId = key_parts[0].substring(0, key_parts[0].length - 1)

                // Inicialization of array if it is new
                if (!objFinal[varNameId]) objFinal[varNameId] = []

                // Dealing with variables itemized. These are variables with format: varname_d+   for example: testcase_123

                //adding a new element in the array already created above.
                try {
                    objFinal[varNameId].push({
                        id: key_parts[1],
                        value: JSON.parse(environment[i].value)
                    })
                } catch (e) {
                    console.log('Environment variable---->: ' + key_parts + ' <----- it is bad formed')
                    console.log('With value: ' + environment[i].value)
                    throw e
                }

            } else if (key_parts && key_parts.length === 2 && key_parts[0].slice(-1) !== '_' && key_parts[1] === '') {
                //if (key_parts && key_parts.length === 1 && listOfNameVar.includes(key_parts[0])) {
                // Inicialization of array if it is new
                //if (!objFinal[key_parts[0]]) objFinal[key_parts[0]] = []

                // Dealing with variables NO itemized. They dont end with _number
                //console.log(JSON.parse(environment[i].value))
                try {
                    objFinal[key_parts[0]] = JSON.parse(environment[i].value)
                } catch (e) {
                    console.log('Environment variable---->: ' + key_parts + ' <----- it is bad formed')
                    console.log('With value: ' + environment[i].value)
                    throw e
                }
            }
        }
        //console.log('Getting variables from environment: ', objFinal)

        return objFinal
    },
    setTestCases: function (testCasesEnvironment) {

        for (let key in testCasesEnvironment) {
            testCases[key] = testCasesEnvironment[key]
            //console.log(testCases)
        }

        if (!testCases.testCase) testCases.testCase = []
        if (!testCases.testConditions) testCases.testConditions = {}

        if (!testCases.testCase.length)
            console.log('Warning: No test Cases to execute. It looks like environment was not selected for the run...')


        let newTestCaseLength = 0

        for (let i = 0, j = testCases.testCase.length; i < j; i++) {
            if (i >= pm.info.iterationCount) {
                console.log('INFO: testCase_' + testCases.testCase[i].id + ' was removed as there are not enough iterations to runs...')
                _.unset(testCases.testCase, i)
            } else newTestCaseLength++
        }

        if (newTestCaseLength > 0) testCases.testCase.length = newTestCaseLength


        testCases.index = 0
        testCases.initialElems = testCases.testCase.length
        // initialize as -1 then with new iteration it will increment++ being 0 for first use.
        testCases.iteration = -1
    },
    backUpTests: function () {

        let testDataCurrentName, testDataBackupName

        if (!testCases.recordIni && !testCases.record) return

        for (let i = 0, j = testCases.testCase.length; i < j && i < pm.info.iterationCount; i++) {

            testDataBackupName = 'old_testCase_' + testCases.testCase[i].id
            testDataCurrentName = 'testCase_' + testCases.testCase[i].id

            // backup in permanent storage testCase_ to Old_testCase
            pm.environment.set(testDataBackupName, pm.environment.get(testDataCurrentName))
        }

        // backup in permanent storage testConditions to Old_testConditions
        if (pm.environment.get('testConditions'))
            pm.environment.set('old_testConditions', pm.environment.get('testConditions'))

    },
    initTestCasesRecordRelated: function () {
        let testDataCurrentName

        if (!testCases.recordIni) return

        for (let i = 0, j = testCases.testCase.length; i < j && i < pm.info.iterationCount; i++) {
            // initialize the whole structure

            pmat.util.setValueObj(testCases, 'testCase.' + i + '.value.output', {})

            // initialize the whole structure
            pmat.util.setValueObj(testCases, 'testCase.' + i + '.value.testConditions', {})

            testDataCurrentName = 'testCase_' + testCases.testCase[i].id

            // save in permanent storage testCase_
            if (!pmat.engine.pmEnvironmentSetJSON(testDataCurrentName, testCases.testCase[i].value))
                throw {
                    name: 'pmatSaveError',
                    message: 'Tried to save in environment but failed while stringifying... could not save. ' + testDataCurrentName + ': ' + testCases.testCase[i].value
                }
        }
    },
    newIteration: function () {

        //console.log('test Cases in newIteration', testCases)
        if (!testCases || !testCases.testCase || !testCases.hasOwnProperty('iteration')) {
            throw new Error('Error: testCases should have been set up as part of the initialization in newRun...')
        }


        //testCases.iteration++
        pmat.engine.incrementTestCasesIndex()

        if (testCases.iteration !== pm.info.iteration) {
            console.log('Warning: postman iteration number: ' + pm.info.iteration + ' and internal iteration number are decoupled: ' + testCases.iteration)
            console.log('Warning: pmat.api.loader is usually executed once per request!!!')
        }

        if (testCases.testCase[testCases.index] && testCases.testCase[testCases.index].hasOwnProperty('value') && testCases.testCase[testCases.index].value.hasOwnProperty('input')) {
            //console.log('setIterationVars. index: ' + testCases.index + ' -->', testCases.testCase[testCases.index].value.input)
            pmat.engine.setIterationVars(testCases.testCase[testCases.index].value.input)

        } else console.log('There are not Input variables to setup for index: ' + testCases.index + ' in iteration: ' + pm.info.iteration)
    },

    incrementTestCasesIndex: function () {
        testCases.iteration++

        //validate dependency    
        if (!testCases || !testCases.testCase || !testCases.hasOwnProperty('iteration')) {
            throw new Error('Error: testCases should have been set up as part of the initialization in newRun...')
        }


        //Recalculate testCases.index to adjuts for the increment in Iteration. 
        //testCases.recordIni== true doesnt iterate over existing testCases.
        //if testCase.length = 0 it means not testCases to test.
        //normal case we calculate with % to reinitialize like lopping.
        if (testCases.record || testCases.recordIni) {
            if (testCases.initialElems === 0) testCases.index = testCases.iteration
            else testCases.index = testCases.iteration % testCases.initialElems
        } else {
            if (!testCases.testCase.length) {
                console.log('Warning: There are not testcases to test or to record... not much will be done')
                testCases.index = -1
            } else testCases.index = testCases.iteration % testCases.initialElems
        }
        //console.log('Variables for the iteration: ' + testCases.iteration, testCases)
    },

    setIterationVarsDoc: 'having a testCase Input object it sets up environment variables to run iteration',
    setIterationVars: function (testCasesInput) {
        for (let key in testCasesInput) {
            if (!pmat.engine.pmEnvironmentSetJSON(key, testCasesInput[key]))
                console.log('Problems parsing: ' + key)
        }
    },

    save: function ({
        varName = null, valueResponsePath = null, value = null, requestName = null
    } = {}) {
        let jsonData
        let testDataCurrentName
        let finalObj

        let returnObj = {}

        returnObj.status = 1
        returnObj.errorMsg = 'Variable was saved Sucessfully'

        // input validation:
        if (varName === null) {
            returnObj.status = -1
            returnObj.errorMsg = 'varName is a mandatory field to the function'
            return returnObj
        }

        if (valueResponsePath !== null && value !== null) {
            returnObj.status = -2
            returnObj.errorMsg = 'valueResponsePath and value cannot specified together. Just 1 valriable is mandatory'
            return returnObj
        }

        // same as: valueResponsePath XOR value
        //if(valueResponsePath? !value: value)
        // Error if both nulls or both filled
        if ((valueResponsePath !== null && value !== null) || (valueResponsePath === null && value === null)) {
            returnObj.status = -3
            returnObj.errorMsg = 'valueResponsePath or value is required.One and only One of them is required.'
            return returnObj
        }

        if (requestName !== null && requestName !== pm.info.requestName) {
            returnObj.status = 2
            returnObj.errorMsg = 'save not apply in the current request: ' + pm.info.requestName + ' vs.: ' + requestName
            return returnObj
        }


        // obtainning object to save    
        if (value !== null) {
            finalObj = value
        } else {
            try {
                jsonData = pm.response.json()
            } catch (e) {
                console.log(e)
                throw e
            }

            finalObj = pmat.util.getValueObj(jsonData, valueResponsePath)

            if (finalObj === null) {
                returnObj.status = 3
                returnObj.errorMsg = 'value was not found using input path in the response of the request. So it was not saved.'
                return returnObj
            }
        }

        if (!testCases || testCases.index === undefined || testCases.index === -1) {
            console.log('testCases before: Save without testCases definitions is only possible in record* mode', testCases)
            throw {
                name: 'pmatSaveError',
                message: 'Save without testCases definitions is only possible in record* mode'
            }
        }
        // updating testCases object with the new object. testCases.testCase.{testcase.index}.input.{varname}
        pmat.engine.setTestCaseInputVar(varName, finalObj)


        //  Persisting change in environment converting to JSON
        testDataCurrentName = 'testCase_' + testCases.testCase[testCases.index].id


        if (!pmat.engine.pmEnvironmentSetJSON(testDataCurrentName, testCases.testCase[testCases.index].value))
            console.log('Problems parsing: ' + testDataCurrentName)

        return returnObj
    },

    setTestCaseInputVar: function (varName, finalObj) {
        //testCase:
        //{
        //[{   
        //  id,
        //  value:
        //   { 
        //    “input”:{

        // compose path for the destination of the object. Then we use setValueObj to update it.
        let pathUpdate = 'testCase.' + testCases.index + '.value.input.' + varName
        let result = pmat.util.setValueObj(testCases, pathUpdate, finalObj)

        if(result === 'FAILED')                 
            throw {
                name: 'engine.etTestCaseInputVar.setValueObj',
                message: 'Error saving input in testCase'
            }

        // in the previous step .value. was updated, now we update id if it doesnt exist.
        if (!testCases.testCase[testCases.index].hasOwnProperty('id')) testCases.testCase[testCases.index].id = testCases.index
    },

    record: function () {

        if (!testCases.record && !testCases.recordIni) {
            return
        }
        /*
            if(testCases.index === -1 && !testCases.recordIni)
            {
                throw {
                    name: 'pmatRecordError',
                    message: 'record without testCases definitions is only possible in recordIni mode'
                }
            }
        */
        //Creating all elements under testCases.testCase

        // Creating id if it doesnt exist and only in recordIni mode.
        if (pmat.util.getValueObj(testCases, 'testCase.' + testCases.index + '.id') === null)
            pmat.util.setValueObj(testCases, 'testCase.' + testCases.index + '.id', testCases.index)


        //delegate
        let testAtCaseList, delegateValue, changeOrCreateNeeded
        testAtCaseList = pmat.util.getValueObj(testCases, 'testAtCaseList')
        let testCaseIndexValue = 'testCase.' + testCases.index + '.value'
        let pathDelegate = testCaseIndexValue + '.testConditions.' + pm.info.requestName + '.delegate'
        let currentDelegateValue = pmat.util.getValueObj(testCases, pathDelegate)

        delegateValue = true
        changeOrCreateNeeded = false

        if ( typeof currentDelegateValue !== 'boolean' )
        {
            changeOrCreateNeeded = true
        }

        if (testAtCaseList && testAtCaseList.includes(pm.info.requestName))
        {
            delegateValue = false

            if(currentDelegateValue !== delegateValue) changeOrCreateNeeded = true
        }

        if(changeOrCreateNeeded)      // We need to change the value
        {
            pmat.util.setValueObj(testCases, pathDelegate, delegateValue)
        }



        // Search for Test conditions.
        let testCaseRNPath = testCaseIndexValue + '.testConditions.' + pm.info.requestName
        let testCaseRN = pmat.util.getValueObj(testCases, testCaseRNPath)
        let testConditionsRNPath = 'testConditions.' + pm.info.requestName
        let testConditionsRN = pmat.util.getValueObj(testCases, testConditionsRNPath)

        //testConditions
        //let pathCondRBN = 'testConditions.' + pm.info.requestName + '.expectedResponse.' + pm.response.code + '.excludeResponseBodyNodes'

        let testCondition, testConditionER, testUserChange

        testCondition = pmat.engine.selectTestCondition(testCaseRN, testConditionsRN)
        testConditionER = pmat.engine.selectTestConditionER(testCaseRN, testConditionsRN)

        /*
        testForRecord function:
            1) Call to select testCondition.
            2) 
        
        */

        if(testCondition)
        {
            if(pmat.engine.expectedStatuDifResult(testConditionER))
            {

                testUserChange = pmat.engine.testUserChange(testCondition)

                if(testUserChange)
                {
                    pmat.engine.masrkTestAsKO()
                    // Output is ignored as it doesnt match expected status in conditions modified by the user
                    // Conditions already exists and still valid.
                    
                }else
                {
                    pmat.engine.markTestAsSkip()
                    pmat.engine.writeOutput(testCases)
                    pmat.engine.deleteOldTestCondition(testConditionER)
                    pmat.engine.createNewTestCondition(testCases)
                }
            }else
            {
                pmat.engine.toTest(testConditionER, testCases.testCase[testCases.index].value.output, testCases.testCase[testCases.index].id)
                //pmat.engine.markTestStatusAsOK()
                //pmat.engine.testResponseBody()
                pmat.engine.writeOutput(testCases)
            }
        }else
        {
            pmat.engine.markTestAsSkip()
            if(testCaseRN === {} || (testCaseRN.delegate === true && testConditionsRN === {})) pmat.engine.markTestAsSkip()
            else pmat.engine.createNewTestCondition(testCases)
            pmat.engine.writeOutput(testCases)

        }
      

        let testDataCurrentName = 'testCase_' + testCases.testCase[testCases.index].id


        // saving permanently in environment testCase_ and testConditions        
        // Persisting testCase_ in environment with conversion to  JSON

        if (!pmat.engine.pmEnvironmentSetJSON(testDataCurrentName, testCases.testCase[testCases.index].value))
            console.log('Problems parsing: ' + testDataCurrentName)

        // Persisting testConditions in environment with conversion to  JSON
        if (!pmat.engine.pmEnvironmentSetJSON('testConditions', testCases.testConditions))
            console.log('Problems parsing: ' + 'testConditions')
    },

    //OK
    expectedStatuDifResult: function(testConditionER) {
        let expectedRC 

        if (!testConditionER) return 3

        expectedRC = Object.keys(testConditionER || {})

        if(expectedRC.length > 1) return 2

        if(expectedRC[0] !== pm.response.code.toString()) return 1
        else return 0
    },

    //OK   
    markTestAsKO: function() {
        pm.test('sample-test-fail', function () { throw new Error() })
    },

    //OK
    markTestAsSkip: function() {
        pm.test.skip('Record-test testCase_' + testCases.testCase[testCases.index].id + ' New TestCase. No test could be done')
    },


    //OK
    writeOutput: function(testCases) {

        let output
        let testCaseIndexValue = 'testCase.' + testCases.index + '.value'

        // Creating all the elements under testCases.testCase.{testCases.index}.value.output
        pmat.util.setValueObj(testCases, testCaseIndexValue + '.output.' + pm.info.requestName + '.status', pm.response.code.toString())

        //responseBody is saved in all cases a record* is true
        try
        {
            output = pm.response.json()
        }catch(e)
        {
            output = pm.response.text()
            console.log('output saved in text mode rather than JSON')
        }

        pmat.util.setValueObj(testCases, testCaseIndexValue + '.output.' + pm.info.requestName + '.responseBody', output)

    },

    deleteOldTestCondition: function(testConditionER) {
        Object.Keys(testConditionER).map(x => delete testConditionER[x])
    },


    createNewTestCondition: function(testCases) {


        // Creating all the elements under testCases.testCase.{testCases.index}.value.testConditions

        let testCaseIndexValue = 'testCase.' + testCases.index + '.value'

        //excludeResponseBodyNodes
        let pathRBN = testCaseIndexValue + '.testConditions.' + pm.info.requestName + '.expectedResponse.' + pm.response.code + '.excludeResponseBodyNodes'
        //let pathRBN = 'excludeResponseBodyNodes'
        //excludeResponseBodyNodes is saved if it's NOT well formed as array. 
        if (!_.isArray(pmat.util.getValueObj(testCases, pathRBN)))
            pmat.util.setValueObj(testCases, pathRBN, [''])

        //testDescOK
        let pathDescOK = testCaseIndexValue + '.testConditions.' + pm.info.requestName + '.expectedResponse.' + pm.response.code + '.testDescOK'
        //testDescOK is saved if it's NOT well formed as string .
        if (typeof pmat.util.getValueObj(testCases, pathDescOK) !== 'string')
            pmat.util.setValueObj(testCases, pathDescOK, 'Add something...')


        // Creating all the elements under testCases.testConditions.{pm.info.requestName}

        //testConditions
        let pathCondRBN = 'testConditions.' + pm.info.requestName + '.expectedResponse.' + pm.response.code + '.excludeResponseBodyNodes'

        //excludeResponseBodyNodes is saved if it's NOT well formed as array or reinitialization is force with recordIni. 
        if (!_.isArray(pmat.util.getValueObj(testCases, pathCondRBN)))
            pmat.util.setValueObj(testCases, pathCondRBN, [''])

        //testDescOK at requestName level
        let pathCondDescOK = 'testConditions.' + pm.info.requestName + '.expectedResponse.' + pm.response.code + '.testDescOK'

        //testDescOK is saved if it's NOT well formed as string or reinitialization is force with recordIni.
        if (typeof pmat.util.getValueObj(testCases, pathCondDescOK) !== 'string')
            pmat.util.setValueObj(testCases, pathCondDescOK, 'Add something...!!!')
    
    },

    selectTestConditionER: function (testCaseRN, testConditionsRN)
    {
        let testCondition

        if(!testCaseRN || !testCondition) return null

        if(testCaseRN.delegate === false)
        {
            
            testCondition = pmat.util.getValueObj(testCaseRN, 'expectedResponse.')

        }else
        {
            testCondition = pmat.util.getValueObj(testConditionsRN, 'expectedResponse.')
        }

        return testCondition
    },

    selectTestCondition: function(testCaseRN, testConditionRN) {
    
        let testCondition = pmat.engine.selectTestConditionER(testCaseRN, testConditionRN)

        let testConditionStatus = Object.keys(testCondition ||{})

        testCondition = pmat.util.getValueObj(testCondition,  testConditionStatus[0])
        
        return testCondition
    },

    testUserChange: function (testCondition) {

        //If there is no testCondition it is because is new record so it has not been modified.
        if(!testCondition) return false

        try
        {

            if (testCondition.excludeResponseBodyNodes === [''] &&
                testCondition.testDescOK === 'Add something...!!!'
            )
            {
                return false
            }
        }catch(e)
        {
            console.log('Expecting testCondition.excludeResponseBodyNodes and testCondition.testDescOK and found: ' + testCondition)
        }

        return true

    },

    validateAndReturnStatus: function (testConditionER) {

        let expectedRCList
        let expectedRC

        if (testConditionER !== null) {
            expectedRCList = pmat.util.objPropsToArray(testConditionER)

            if (expectedRCList && expectedRCList.length === 1) expectedRC = expectedRCList[0]
            else throw { name: 'pmatCorruptedTC', message: 'testCases.TestCase[{index}].testConditions.{requestName}.expectedResponse should always have one and only one status' }
        }

        return expectedRC
    },

    test: function () {
        let toTestExpectedResponsePath, toTestExpectedResponse, toTestExpectedResponseRequest, toTestOutputPath, toTestOutput, testDataCurrentName, delegate, requestNamePath

        //console.log(JSON.stringify(testCases))

        // obtain toTest,
        //console.log(testCases)
        requestNamePath = 'testCase.' + testCases.index + '.value.testConditions.' + pm.info.requestName
        //requestName = pmat.util.getValueObj(testCases, requestNamePath)
        toTestExpectedResponsePath = requestNamePath + '.expectedResponse'
        toTestExpectedResponse = pmat.util.getValueObj(testCases, toTestExpectedResponsePath)
        toTestExpectedResponseRequest = pmat.util.getValueObj(testCases, 'testConditions.' + pm.info.requestName + '.expectedResponse')
        delegate = pmat.util.getValueObj(testCases, requestNamePath + '.delegate')

        // obtain toTestOutput
        toTestOutputPath = 'testCase.' + testCases.index + '.value.output.' + pm.info.requestName + '.responseBody'
        toTestOutput = pmat.util.getValueObj(testCases, toTestOutputPath)

        //console.log('output to test: ', toTestOutput)
        //console.log(toTestOutputPath, testCases)

        console.log({delegate, toTestOutput, toTestExpectedResponse, toTestExpectedResponseRequest})
        if (toTestOutput === null || toTestExpectedResponse === null) {
            pm.test('Test mode uses testCases requiring output responseBody and testConditions expected response... These values were set up in last record. Did last record execution was setup correctly?',
                function () {
                    pm.expect(toTestOutput).to.not.equal(null)
                    pm.expect(toTestExpectedResponse).to.not.equal(null)
                }
            )
            return
        }

        //console.log('before testing', testCases, toTestExpectedResponse, toTestExpectedResponseRequest,toTestOutput)
        if (!delegate) {
            
            testDataCurrentName = 'testCase_' + testCases.testCase[testCases.index].id
            if(toTestExpectedResponse && toTestOutput)
                pmat.engine.toTest(toTestExpectedResponse, toTestOutput, testDataCurrentName)
        } else {

            if (toTestExpectedResponseRequest && toTestOutput) {
                testDataCurrentName = 'testConditions'
                pmat.engine.toTest(toTestExpectedResponseRequest, toTestOutput, testDataCurrentName)
            }
        }
        console.log('end of test...')
    },

    toTest: function (toTestExpectedResponse, output, idTest) {
        let toTestStatusValue = [], toTestExpectedResponseCond, excludeNodes, result, responseJson

        console.log({toTestExpectedResponse, output, idTest})
        //console.log('in toTest', toTestExpectedResponse,output, idTest)

        //nothing to test.
        if (toTestExpectedResponse === null) return

        // same thing as below for(let key in toTestExpectedResponse) toTestStatusValue.push(key)

        toTestStatusValue = pmat.util.objPropsToArray((toTestExpectedResponse))

        // obtain testConditions.{pm.info.requestName}.expectedResponse
        toTestExpectedResponseCond = pmat.util.getValueObj(toTestExpectedResponse, pm.response.code.toString())

        let description
        if (toTestExpectedResponseCond === null || !toTestExpectedResponseCond.testDescOK) description = 'Description doesnt exist'
        else description = toTestExpectedResponseCond.testDescOK

        pm.test(idTest + ': Validating Response code. ' + description,
            function () {
                pm.expect(pm.response.code.toString()).to.be.oneOf(toTestStatusValue)
            }
        )

        excludeNodes = toTestExpectedResponseCond.excludeResponseBodyNodes

        if (excludeNodes !== undefined) {
            // If it is not an Array I convert it to an array.
            if (excludeNodes.constructor !== Array) {
                excludeNodes[0] = excludeNodes
            }

            responseJson = pm.response.json()

            result = pmat.engine.compare(output, responseJson, excludeNodes, undefined)
        } else result = _.isEqualWith(output, responseJson)

        if (result) console.log('TEST OK :-)')
        else console.log(`TEST ${pm.info.requestName} FAILED!!!  response doesnt match expected result`, JSON.stringify(output), JSON.stringify(responseJson))

        pm.test(idTest + ': Validating Response body. ' + description,
            function () {
                if (!result) pm.expect('Excluded nodes: ' + excludeNodes + ' Stored: ' + JSON.stringify(output)).to.be.equal('Obtained: ' + JSON.stringify(responseJson))
            }
        )
    },
    
    pathToRegexDoc: 'Converts path search into regular expression',
    pathToRegex: function (...pathsSearch) {
        //str.split(search).join(writement)
        let result
        let regexToReturn = []

        for (let i = 0, j = pathsSearch.length; i < j; i++) {
            result = pathsSearch[i].split('.').join('[.]')
            result = result.split('*').join('[^.]*')
            result = result.split('[^.]*[^.]*').join('.*')
            result = '^' + result + '$'
            regexToReturn[i] = new RegExp(result)
        }
        return regexToReturn
    },
    testRegexsORDoc: 'Converts path search into regular expression',
    testRegexsOR: function (toValidate, ...regexsOR) {
        let i, j

        for (i = 0, j = regexsOR.length; i < j && !regexsOR[i].test(toValidate); i++);

        if (i === j) return false
        else return true
    },

    removeNodesDoc: '1st param: Json Object\n2nd param: array of regularExpr to match paths to exclude. Main object represented by: root.\n3rd param: function that if true allows the omitt to do its work. In this case we ommit\n           only values that are end-nodes.',
    removeNodes: function (obj, exclude, validateFun) {

        let _path = ''

        removeNodesImp(obj, exclude, validateFun)

        function removeNodesImp(obj, exclude, validateFun) {
            let temporalPath
            for (let key in obj) {

                // we dont need '.' at the beginning of the root node.
                if (_path === '') temporalPath = key
                else temporalPath = _path + '.' + key

                if (pmat.engine.testRegexsOR(temporalPath, ...exclude)) {
                    if (!validateFun) {
                        //console.log('unsetting obj[key]: ' + obj[key])
                        _.unset(obj, key)
                    } else
                    {
                        if (validateFun(obj[key]))
                        {
                            //console.log('unsetting allowed by function')
                            _.unset(obj, key)
                        }//else console.log('unsetting NOT allowed by function')
                    }
                }

                if (typeof obj[key] === 'object') {
                    // add a node to the path
                    // we dont need '.' in the root node.
                    _path = temporalPath

                    // We call recursively passing a child node.
                    removeNodesImp(obj[key], exclude, validateFun)

                    //remove last node from the path: similar to: ../
                    _path = _path.split('.')
                    _path ? _path.pop() : console.log('It got to null')
                    _path = _path.join('.')
                }
            }
        }
    },
    compare: function (objA, objB, excludeNodesByPath, excludeNodesIfBooleanCallback) {
        let regexsToCheck, result

        regexsToCheck = pmat.engine.pathToRegex(...excludeNodesByPath)

        pmat.engine.removeNodes(objA, regexsToCheck, excludeNodesIfBooleanCallback)
        pmat.engine.removeNodes(objB, regexsToCheck, excludeNodesIfBooleanCallback)

        result = _.isEqualWith(objA, objB)

        return result
    },
    pmEnvironmentGetJSON: function (varName) {

        let toReturn = pm.environment.get(varName)

        if (toReturn !== undefined) {
            try {
                return JSON.parse(toReturn)
            } catch (e) {
                // if there is a problem parsing we return the object as it is that when exist it will be string and if not it will be undefined.
                return toReturn
            }
        } else return toReturn
    },
    pmGlobalsGetJSON: function (varName) {

        //pm.globals.get returns string or undefined if not found.
        let toReturn = pm.globals.get(varName)

        if (toReturn !== undefined) {
            try {
                return JSON.parse(toReturn)
            } catch (e) {
                // if there is a problem parsing we return the object as it is that when exist it will be string and if not it will be undefined.
                return toReturn
            }
        } else return toReturn
    },
    pmEnvironmentSetJSON: function (varName, obj) {
        let stringJSON
        try {


            // stringify introduces double-quotes in string that are not needed. we skip stringify if obj is a simple string.
            if (typeof obj === 'string') stringJSON = obj
            else stringJSON = JSON.stringify(obj)

            //console.log('setting up: ' + varName + ': ', stringJSON)

            //pmat.util.printKeysValues(pm.environment)

            // check if environment was selected
            if (!pm.environment.values.toJSON().length) throw {
                name: 'pmatSaveError',
                message: 'Tried to save in environment but no environment was selected:... could not save. ' + varName + ': ' + stringJSON
            }

            else pm.environment.set(varName, stringJSON)

            return true
        } catch (e) {
            if (e.name === 'pmatSaveError') {
                throw e
            } else {
                console.log('problem stringifying... stringify result: ' + stringJSON)
                return false
            }
        }
    },
    pmGlobalsSetJSON: function (varName, obj) {
        let stringJSON

        try {


            // stringify introduces double-quotes in string that are not needed. we skip stringify if obj is a simple string.
            if (typeof obj === 'string') stringJSON = obj
            else stringJSON = JSON.stringify(obj)

            pm.globals.set(varName, stringJSON)
            return true
        } catch (e) {
            console.log('Error in pmGlobalsSetJSON')
            return false
        }
    },
    splitInTwoFindPrefixes: function (varName, ...prefixList) {
        let foundPrefixIndex
        let result = []

        foundPrefixIndex = _.findIndex(prefixList, function (o) { return varName.indexOf(o) === 0 }) // console.log('foundPrefixIndex',varName.indexOf(o))

        if (foundPrefixIndex !== -1) {
            result[0] = prefixList[foundPrefixIndex]
            result[1] = varName.substring(prefixList[foundPrefixIndex].length)
        }

        return result

        //pmat.util.splitInTwo(varName, prefixList[foundPrefixIndex])
    }
}

//@deleteNextLine
module.exports = pmat.engine