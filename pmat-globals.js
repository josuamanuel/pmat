'use strict';

const pmat = {};


//let testCases;

pmat.api= {    
    "getTestCases": function() {
        if (!pm.variables.get('flag_' + pm.info.iteration)) {
            pm.variables.set('flag_' + pm.info.iteration, true);
    
            if (pm.info.iteration === 0) {
                return {testEngineState:'newRun'};
            }else
            {
                let testCases = pm.variables.get('testCases');
                testCases.testEngineState = 'newIteration';
                return testCases;
            }
        }else
        {
            let testCases = pm.variables.get('testCases');
            testCases.testEngineState = 'oldIteration';
            return testCases;
        }
    },
    "loader": function () {
        if (testCases.testEngineState === 'newRun')
        { 
            // this part is only executed once per execution. pm.variables.set are stateless after execution but
            // they are stateful during the whole execution of a runner or in postman in a request.

            pmat.api.throwExceptionIfEnvNotSelected();

            console.log('starting to Load Environment: ');
            pmat.api.setTestCasesParams();
            pmat.engine.newRun();
        }

        if(testCases.testEngineState === 'newRun' || testCases.testEngineState === 'newIteration')
        {
            console.log('starting to Load Iteration: ' + pm.info.iteration);
            //pmat.api.getValidTestCases();
            pmat.engine.newIteration();
        } else console.log('Iteration: ' + pm.info.iteration + ' was previously loaded...');

        //pmat.api.getValidTestCases();

        if (pm.info.eventName === 'test' && !pm.variables.get('flagr_' + pm.info.requestId + pm.info.iteration)) {
            //console.log('flagr_' + pm.info.requestId + '-' + pm.info.iteration);
            pm.variables.set('flagr_' + pm.info.requestId + pm.info.iteration, true);

            if (testCases.record || testCases.recordIni) pmat.api.record();
            else pmat.api.test();
        }

    },
    "throwExceptionIfEnvNotSelected": function() {
        if (!pm.environment.values.toJSON().length) {
            let errorException = {
                name: 'pmatSaveError',
                message: 'environment is empty... we cancel as it looks no environment was selected and save is compromised...'
            };
            console.log(errorException);
            throw errorException;
        }
    },
    "setTestCasesParams": function()
    {
        if ((typeof pm.globals.get('record') === "boolean" && pm.globals.get('record')) || (typeof pm.globals.get('record') === "string" && pm.globals.get('record') === "true")) testCases.record = true;
        else
            if ((typeof pm.globals.get('recordIni') === "boolean" && pm.globals.get('recordIni')) || (typeof pm.globals.get('recordIni') === "string" && pm.globals.get('recordIni') === "true")) testCases.recordIni = true;


        let testAtCaseList = pmat.engine.pmGlobalsGetJSON('testAtCaseList');

        testCases.testAtCaseList = [];

        if (testAtCaseList) {
            if (_.isArray(testAtCaseList)) testCases.testAtCaseList = testAtCaseList;
            else {
                if (testAtCaseList.indexOf(',') === -1) testCases.testAtCaseList[0] = testAtCaseList;
                else console.log('ERROR!!!: globals param testAtCaseList is bad formatted. It should be JSON format. example: ["refres"]');
            }
        }

    },
    "save": function ({ varName = null, valueResponsePath = null, value = null, requestName = null } = {}) {
        try {

            return pmat.engine.save({ varName, valueResponsePath, value, requestName });
        } catch (e) {
            console.log('failed to execute pmat.egine.save: exception name: ' + e.name + ' message: ' + e.message);

            pm.test('Critital ERROR!!!! There have been exceptions... take a look to the console logs to see them...',
                function () {
                    pm.expect(0).to.equal(1);
                }
            );
            //postman.setNextRequest('pmat-end');
        }
    },
    "record": function () {

        pmat.engine.record();
    },
    "test": function () {
        pmat.engine.test();
    }
};


let _ = require('lodash'),
arrayOfStrings,
base64Strings;


pmat.engine = {
    "newRun": function () {
        let testCasesEnvironment;

        try {

            //Iterate through gloablas to find variables that will compose the runtime testCases.
            testCasesEnvironment = pmat.engine.getEnvironmentVariables('testCase_', 'testConditions');
            //console.log('testCasesEnvironment',testCasesEnvironment);
            // Set testCases initializing index and iteration
            pmat.engine.setTestCases(testCasesEnvironment);

            //Before initializing something we will save a backup...
            pmat.engine.backUpTests();

            if (testCases.recordIni) pmat.engine.initTestCasesRecordRelated();

        } catch (e) {
            console.log('pmat.engine.newRun: testCases format is not correct: ' + e);
            throw e;
        }
    },
    "getEnvironmentVariablesDoc": "having a list of variables names, it finds them in environment and return object with all values",
    "getEnvironmentVariables": function (...listOfNameVar) {
        const NUMEROS = /^\d+$/;

        let objFinal = {};
        let key_parts = [];
        let varNameId;

        let environment = pm.environment.values.toJSON();
        //console.log(environment);

        if (!environment) return null;

        for (let i = 0, j = environment.length; i < j; i++) {

            key_parts = pmat.engine.splitInTwoFindPrefixes(environment[i].key, ...listOfNameVar);

            //key_parts = environment[i].key.split('_');

            //console.log('key_parts: ', key_parts);
            if (key_parts && key_parts.length === 2 && key_parts[0].slice(-1) === '_' && key_parts[1].match(NUMEROS)) {
                //remove last '_' from string.
                varNameId = key_parts[0].substring(0, key_parts[0].length - 1);

                // Inicialization of array if it is new
                if (!objFinal[varNameId]) objFinal[varNameId] = [];

                // Dealing with variables itemized. These are variables with format: varname_d+   for example: testcase_123

                //adding a new element in the array already created above.
                try {
                    objFinal[varNameId].push({
                        id: key_parts[1],
                        value: JSON.parse(environment[i].value)
                    });
                } catch (e) {
                    console.log('Environment variable---->: ' + key_parts + ' <----- it is bad formed');
                    console.log('With value: ' + environment[i].value);
                    throw e;
                }

            } else if (key_parts && key_parts.length === 2 && key_parts[0].slice(-1) !== '_' && key_parts[1] === '') {
                //if (key_parts && key_parts.length === 1 && listOfNameVar.includes(key_parts[0])) {
                // Inicialization of array if it is new
                //if (!objFinal[key_parts[0]]) objFinal[key_parts[0]] = [];

                // Dealing with variables NO itemized. They dont end with _number
                //console.log(JSON.parse(environment[i].value));
                try {
                    objFinal[key_parts[0]] = JSON.parse(environment[i].value);
                } catch (e) {
                    console.log('Environment variable---->: ' + key_parts + ' <----- it is bad formed');
                    console.log('With value: ' + environment[i].value);
                    throw e;
                }
            }
        }
        //console.log('Getting variables from environment: ', objFinal);

        return objFinal;
    },
    "setTestCases": function (testCasesEnvironment) {

        for (let key in testCasesEnvironment) {
            testCases[key] = testCasesEnvironment[key];
            //console.log(testCases);
        }

        if (!testCases.testCase) testCases.testCase = [];
        if (!testCases.testConditions) testCases.testConditions = {};

        if (!testCases.testCase.length)
            console.log('Warning: No test Cases to execute. It looks like environment was not selected for the run...');


        let newTestCaseLength = 0;

        for (let i = 0, j = testCases.testCase.length; i < j; i++) {
            if (i >= pm.info.iterationCount) {
                console.log('INFO: testCase_' + testCases.testCase[i].id + ' was removed as there are not enough iterations to runs...');
                _.unset(testCases.testCase, i);
            } else newTestCaseLength++;
        }

        if (newTestCaseLength > 0) testCases.testCase.length = newTestCaseLength;


        testCases.index = 0;
        testCases.initialElems = testCases.testCase.length;
        // initialize as -1 then with new iteration it will increment++ being 0 for first use.
        testCases.iteration = -1;
    },
    "backUpTests": function () {

        let testDataCurrentName, testDataBackupName;

        if (!testCases.recordIni && !testCases.record) return;

        for (let i = 0, j = testCases.testCase.length; i < j && i < pm.info.iterationCount; i++) {

            testDataBackupName = 'old_testCase_' + testCases.testCase[i].id;
            testDataCurrentName = 'testCase_' + testCases.testCase[i].id;

            // backup in permanent storage testCase_ to Old_testCase
            pm.environment.set(testDataBackupName, pm.environment.get(testDataCurrentName));
        }

        // backup in permanent storage testConditions to Old_testConditions
        if (pm.environment.get('testConditions'))
            pm.environment.set('old_testConditions', pm.environment.get('testConditions'));

    },
    "initTestCasesRecordRelated": function () {
        let testDataCurrentName;

        if (!testCases.recordIni) return;

        for (let i = 0, j = testCases.testCase.length; i < j && i < pm.info.iterationCount; i++) {
            // initialize the whole structure

            pmat.util.setValueObj(testCases, 'testCase.' + i + '.value.output', {});

            // initialize the whole structure
            pmat.util.setValueObj(testCases, 'testCase.' + i + '.value.testConditions', {});

            testDataCurrentName = 'testCase_' + testCases.testCase[i].id;

            // save in permanent storage testCase_
            if (!pmat.engine.pmEnvironmentSetJSON(testDataCurrentName, testCases.testCase[i].value))
                throw {
                    name: 'pmatSaveError',
                    message: 'Tried to save in environment but failed while stringifying... could not save. ' + testDataCurrentName + ': ' + testCases.testCase[i].value
                };
        }
    },
    "newIteration": function () {

        //console.log('test Cases in newIteration', testCases);
        if (!testCases || !testCases.testCase || !testCases.hasOwnProperty('iteration')) {
            throw new Error('Error: testCases should have been set up as part of the initialization in newRun...');
        }


        //testCases.iteration++;
        pmat.engine.incrementTestCasesIndex();

        if (testCases.iteration !== pm.info.iteration) {
            console.log('Warning: postman iteration number: ' + pm.info.iteration + ' and internal iteration number are decoupled: ' + testCases.iteration);
            console.log('Warning: pmat.api.loader is usually executed once per request!!!');
        }

        if (testCases.testCase[testCases.index] && testCases.testCase[testCases.index].hasOwnProperty('value') && testCases.testCase[testCases.index].value.hasOwnProperty('input')) {
            //console.log('setIterationVars. index: ' + testCases.index + ' -->', testCases.testCase[testCases.index].value.input);
            pmat.engine.setIterationVars(testCases.testCase[testCases.index].value.input);

        } else console.log('There are not Input variables to setup for index: ' + testCases.index + ' in iteration: ' + pm.info.iteration);
    },
    "incrementTestCasesIndex": function () {
        testCases.iteration++;

        //validate dependency    
        if (!testCases || !testCases.testCase || !testCases.hasOwnProperty('iteration')) {
            throw new Error('Error: testCases should have been set up as part of the initialization in newRun...');
        }


        //Recalculate testCases.index to adjuts for the increment in Iteration. 
        //testCases.recordIni== true doesnt iterate over existing testCases.
        //if testCase.length = 0 it means not testCases to test.
        //normal case we calculate with % to reinitialize like lopping.
        if (testCases.record || testCases.recordIni) {
            if (testCases.initialElems === 0) testCases.index = testCases.iteration;
            else testCases.index = testCases.iteration % testCases.initialElems;
        } else {
            if (!testCases.testCase.length) {
                console.log('Warning: There are not testcases to test or to record... not much will be done');
                testCases.index = -1;
            } else testCases.index = testCases.iteration % testCases.initialElems;
        }
        //console.log('Variables for the iteration: ' + testCases.iteration, testCases);
    },
    "setIterationVarsDoc": "having a testCase Input object it sets up environment variables to run iteration",
    "setIterationVars": function (testCasesInput) {
        for (let key in testCasesInput) {
            if (!pmat.engine.pmEnvironmentSetJSON(key, testCasesInput[key]))
                console.log('Problems parsing: ' + key);
        }
    },
    "save": function ({
        varName = null, valueResponsePath = null, value = null, requestName = null
    } = {}) {
        let jsonData;
        let testDataCurrentName;
        let testDataCurrent;
        let finalObj;

        let returnObj = {};

        returnObj.status = 1;
        returnObj.errorMsg = 'Variable was saved Sucessfully';

        // input validation:
        if (varName === null) {
            returnObj.status = -1;
            returnObj.errorMsg = 'varName is a mandatory field to the function';
            return returnObj;
        }

        if (valueResponsePath !== null && value !== null) {
            returnObj.status = -2;
            returnObj.errorMsg = 'valueResponsePath and value cannot specified together. Just 1 valriable is mandatory';
            return returnObj;
        }

        // same as: valueResponsePath XOR value
        //if(valueResponsePath? !value: value)
        // Error if both nulls or both filled
        if ((valueResponsePath !== null && value !== null) || (valueResponsePath === null && value === null)) {
            returnObj.status = -3;
            returnObj.errorMsg = 'valueResponsePath or value is required.One and only One of them is required.';
            return returnObj;
        }

        if (requestName !== null && requestName !== pm.info.requestName) {
            returnObj.status = 2;
            returnObj.errorMsg = 'save not apply in the current request: ' + pm.info.requestName + ' vs.: ' + requestName;
            return returnObj;
        }


        // obtainning object to save    
        if (value !== null) {
            finalObj = value;
        } else {
            try {
                jsonData = pm.response.json();
            } catch (e) {
                console.log(e);
                throw e;
            }

            finalObj = pmat.util.getValueObj(jsonData, valueResponsePath);

            if (finalObj === null) {
                returnObj.status = 3;
                returnObj.errorMsg = 'value was not found using input path in the response of the request. So it was not saved.';
                return returnObj;
            }
        }

        if (!testCases || testCases.index === undefined || testCases.index === -1) {
            console.log('testCases before: Save without testCases definitions is only possible in record* mode', testCases);
            throw {
                name: 'pmatSaveError',
                message: 'Save without testCases definitions is only possible in record* mode'
            };
        }
        // updating testCases object with the new object. testCases.testCase.{testcase.index}.input.{varname}
        pmat.engine.setTestCaseInputVar(varName, finalObj);


        //  Persisting change in environment converting to JSON
        testDataCurrentName = 'testCase_' + testCases.testCase[testCases.index].id;


        if (!pmat.engine.pmEnvironmentSetJSON(testDataCurrentName, testCases.testCase[testCases.index].value))
            console.log('Problems parsing: ' + testDataCurrentName);

        return returnObj;
    },
    "setTestCaseInputVar": function (varName, finalObj) {
        //testCase:
        //{
        //[{   
        //  id,
        //  value:
        //   { 
        //    “input”:{

        // compose path for the destination of the object. Then we use setValueObj to update it.
        let pathUpdate = 'testCase.' + testCases.index + '.value.input.' + varName;
        let result = pmat.util.setValueObj(testCases, pathUpdate, finalObj);

        // in the previous step .value. was updated, now we update id if it doesnt exist.
        if (!testCases.testCase[testCases.index].hasOwnProperty('id')) testCases.testCase[testCases.index].id = testCases.index;
    },
    "record": function () {

        if (!testCases.record && !testCases.recordIni) {
            return;
        }
        /*
            if(testCases.index === -1 && !testCases.recordIni)
            {
                throw {
                    name: 'pmatRecordError',
                    message: 'record without testCases definitions is only possible in recordIni mode'
                };
            }
        */
        //Creating all elements under testCases.testCase

        // Creating id if it doesnt exist and only in recordIni mode.
        if (pmat.util.getValueObj(testCases, 'testCase.' + testCases.index + '.id') === null)
            pmat.util.setValueObj(testCases, 'testCase.' + testCases.index + '.id', testCases.index);

        // Search for Test conditions.
        let testCaseIndexValue = 'testCase.' + testCases.index + '.value';
        let testConditionsERPath = testCaseIndexValue + '.testConditions.' + pm.info.requestName + '.expectedResponse';
        let testConditionsER = pmat.util.getValueObj(testCases, testConditionsERPath);

        let recordOutput = true;
        let skipOKTest = false;
        let testKO = false;

        if (testConditionsER === null) {
            // record all as it is a new request;
            //test is OK marked as SKKIPED        
            recordOutput = true;
            skipOKTest = true;
            testKO = false;
        } else {
            if (testConditionsER.hasOwnProperty(pm.response.code)) {
                //Record all. fields will be updated.
                //Test
                recordOutput = true;
                skipOKTest = false;
                testKO = false;
            } else {
                // Discard Status code and Output as expected response exist but the responseCode doesnt match.
                // Record the rest of the fields..
                // Test is KO.
                recordOutput = false;
                skipOKTest = false;
                testKO = true;
            }

        }


        let expectedRCList;
        let expectedRC;

        if (testConditionsER !== null) {
            expectedRCList = pmat.util.objPropsToArray(testConditionsER);

            if (expectedRCList && expectedRCList.length === 1) expectedRC = expectedRCList[0];
            else throw { name: 'pmatCorruptedTC', message: 'testCases.TestCase[{index}].testConditions.{requestName}.expectedResponse should always have one and only one status' };
        }

        if (testKO) {
            pm.test('Record-test testCase_' + testCases.testCase[testCases.index].id + ' expected Response vs Actual request Response code',
                function () {
                    pm.expect(pm.response.to.have.statusCode(expectedRC));
                }
            );
        }

        if (skipOKTest) {
            pm.test.skip('Record-test testCase_' + testCases.testCase[testCases.index].id + ' New TestCase. No test could be done',
                function () {
                    return;
                }
            );
        }

        if (recordOutput && !testKO && !skipOKTest) {
            console.log('test in recording', expectedRC, typeof expectedRC);
            pm.test('Record-test testCase_' + testCases.testCase[testCases.index].id + ' validation on the existing condition',
                function () {
                    pm.expect(pm.response.to.have.statusCode(expectedRC));
                }
            );
        }

        // Creating all the elements under testCases.testCase.{testCases.index}.value.output
        if (recordOutput) {
            pmat.util.setValueObj(testCases, testCaseIndexValue + '.output.' + pm.info.requestName + '.status', pm.response.code.toString());

            //responseBody is saved in all cases a record* is true
            pmat.util.setValueObj(testCases, testCaseIndexValue + '.output.' + pm.info.requestName + '.responseBody', pm.response.json());
        }

        // Creating all the elements under testCases.testCase.{testCases.index}.value.testConditions


        //delegate
        let testAtCaseList, delegateValue;
        testAtCaseList = pmat.util.getValueObj(testCases, 'testAtCaseList');
        // delegateValue by default is true. Conditions are at request level unless specified in testAtCaseList.
        delegateValue = true;
        if (testAtCaseList && testAtCaseList.includes(pm.info.requestName)) delegateValue = false;

        let pathDelegate = testCaseIndexValue + '.testConditions.' + pm.info.requestName + '.expectedResponse.' + pm.response.code + '.delegate';
        //delegate is saved if it's NOT well formed
        //if(typeof pmat.util.getValueObj(testCases, pathDelegate) !== 'boolean')
        console.log('Just before pmat.util.setValueObj(',testCases, pathDelegate, delegateValue);
        pmat.util.setValueObj(testCases, pathDelegate, delegateValue);

        //excludeResponseBodyNodes
        let pathRBN = testCaseIndexValue + '.testConditions.' + pm.info.requestName + '.expectedResponse.' + pm.response.code + '.excludeResponseBodyNodes';
        //excludeResponseBodyNodes is saved if it's NOT well formed as array. 
        if (!_.isArray(pmat.util.getValueObj(testCases, pathRBN)))
            pmat.util.setValueObj(testCases, pathRBN, ['']);

        //testDescOK
        let pathDescOK = testCaseIndexValue + '.testConditions.' + pm.info.requestName + '.expectedResponse.' + pm.response.code + '.testDescOK';
        //testDescOK is saved if it's NOT well formed as string .
        if (typeof pmat.util.getValueObj(testCases, pathDescOK) !== 'string')
            pmat.util.setValueObj(testCases, pathDescOK, 'Add something...');

        /*
            // We need to clean responseCodes different than the current response if recordIni or record. ExpectedResponse.length == 1
            let expectedResponse = pmat.util.getValueObj(testCases, testCaseIndexValue + '.testConditions.' + pm.info.requestName + '.expectedResponse');
            
            for (let key in expectedResponse)
            {
                if(key !== pm.response.code.toString() && (testCases.recordIni || testCases.record))
                {
                    _.unset(expectedResponse, key);
                    console.log('Information: ' + pm.info.requestName + '.expectedResponse.' + key + ': was DELETED because new status is: ' + pm.response.code);
                }
            }
        */
        // Creating all the elements under testCases.testConditions.{pm.info.requestName}

        //testConditions
        let pathCondRBN = 'testConditions.' + pm.info.requestName + '.expectedResponse.' + pm.response.code + '.excludeResponseBodyNodes';

        //excludeResponseBodyNodes is saved if it's NOT well formed as array or reinitialization is force with recordIni. 
        if (!_.isArray(pmat.util.getValueObj(testCases, pathCondRBN)))
            pmat.util.setValueObj(testCases, pathCondRBN, ['']);

        let testDataCurrentName = 'testCase_' + testCases.testCase[testCases.index].id;

        //testDescOK at requestName level
        let pathCondDescOK = 'testConditions.' + pm.info.requestName + '.expectedResponse.' + pm.response.code + '.testDescOK';

        //testDescOK is saved if it's NOT well formed as string or reinitialization is force with recordIni.
        if (typeof pmat.util.getValueObj(testCases, pathCondDescOK) !== 'string')
            pmat.util.setValueObj(testCases, pathCondDescOK, 'Add something...!!!');

        // saving permanently in environment testCase_ and testConditions        
        // Persisting testCase_ in environment with conversion to  JSON

        if (!pmat.engine.pmEnvironmentSetJSON(testDataCurrentName, testCases.testCase[testCases.index].value))
            console.log('Problems parsing: ' + testDataCurrentName);

        // Persisting testConditions in environment with conversion to  JSON
        if (!pmat.engine.pmEnvironmentSetJSON('testConditions', testCases.testConditions))
            console.log('Problems parsing: ' + 'testConditions');
    },
    "test": function () {
        let toTestExpectedResponsePath, toTestExpectedResponse, toTestExpectedResponseRequest, toTestOutputPath, toTestOutput, testDataCurrentName;

        //console.log(JSON.stringify(testCases));

        // obtain toTest,
        //console.log(testCases);
        toTestExpectedResponsePath = 'testCase.' + testCases.index + '.value.testConditions.' + pm.info.requestName + '.expectedResponse';
        toTestExpectedResponse = pmat.util.getValueObj(testCases, toTestExpectedResponsePath);
        toTestExpectedResponseRequest = pmat.util.getValueObj(testCases, 'testConditions.' + pm.info.requestName + '.expectedResponse');

        // obtain toTestOutput
        toTestOutputPath = 'testCase.' + testCases.index + '.value.output.' + pm.info.requestName + '.responseBody';
        toTestOutput = pmat.util.getValueObj(testCases, toTestOutputPath);

        //console.log('output to test: ', toTestOutput);
        //console.log(toTestOutputPath, testCases);

        if (toTestOutput === null || toTestExpectedResponse === null) {
            pm.test('A previous record creates an Ouput and expected Output to be used in test mode',
                function () {
                    pm.expect(toTestOutput).to.not.equal(null);
                    pm.expect(toTestExpectedResponse).to.not.equal(null);
                }
            );
            return;
        }

        //console.log('before testing', testCases, toTestExpectedResponse, toTestExpectedResponseRequest,toTestOutput);
        if (!pmat.util.getValueObj(toTestExpectedResponse, pm.response.code.toString() + '.delegate')) {
            testDataCurrentName = 'testCase_' + testCases.testCase[testCases.index].id;
            pmat.engine.toTest(toTestExpectedResponse, toTestOutput, testDataCurrentName);
        } else {
            if (toTestExpectedResponseRequest !== null) {
                testDataCurrentName = 'testConditions';
                pmat.engine.toTest(toTestExpectedResponseRequest, toTestOutput, testDataCurrentName);
            }
        }
        console.log('end of test...');
    },
    "toTest": function (toTestExpectedResponse, output, idTest) {
        let toTestStatusValue = [], toTestExpectedResponseCond, excludeNodes, result, responseJson;

        //console.log('in toTest', toTestExpectedResponse,output, idTest);

        //nothing to test.
        if (toTestExpectedResponse === null) return;

        // same thing as below for(let key in toTestExpectedResponse) toTestStatusValue.push(key);

        toTestStatusValue = pmat.util.objPropsToArray((toTestExpectedResponse));

        // obtain testConditions.{pm.info.requestName}.expectedResponse
        toTestExpectedResponseCond = pmat.util.getValueObj(toTestExpectedResponse, pm.response.code.toString());

        let description;
        if (toTestExpectedResponseCond === null || !toTestExpectedResponseCond.testDescOK) description = 'Description doesnt exist';
        else description = toTestExpectedResponseCond.testDescOK;

        pm.test(idTest + ': Validating Response code. ' + description,
            function () {
                pm.expect(pm.response.code.toString()).to.be.oneOf(toTestStatusValue);
            }
        );

        excludeNodes = toTestExpectedResponseCond.excludeResponseBodyNodes;

        if (excludeNodes !== undefined) {
            // If it is not an Array I convert it to an array.
            if (excludeNodes.constructor !== Array) {
                excludeNodes[0] = excludeNodes;
            }

            responseJson = pm.response.json();

            result = pmat.engine.compare(output, responseJson, excludeNodes, undefined);
        } else result = _.isEqualWith(output, responseJson);

        if (result) console.log('TEST OK :-)');
        else console.log('TEST FAILED!!! response doesnt match expected result', JSON.stringify(output), JSON.stringify(responseJson));

        pm.test(idTest + ': Validating Response body. ' + description,
            function () {
                if (!result) pm.expect('Excluded nodes: ' + excludeNodes + ' Stored: ' + JSON.stringify(output)).to.be.equal('Obtained: ' + JSON.stringify(responseJson));
            }
        );
    },
    "assert": function (...variablesToCompare) {

    },
    "pathToRegexDoc": "Converts path search into regular expression",
    "pathToRegex": function (...pathsSearch) {
        //str.split(search).join(replacement)
        let result;
        let regexToReturn = [];

        for (let i = 0, j = pathsSearch.length; i < j; i++) {
            result = pathsSearch[i].split('.').join('[.]');
            result = result.split('*').join('[^.]*');
            result = result.split('[^.]*[^.]*').join('.*');
            result = '^' + result + '$';
            regexToReturn[i] = new RegExp(result);
        }
        return regexToReturn;
    },
    "testRegexsORDoc": "Converts path search into regular expression",
    "testRegexsOR": function (toValidate, ...regexsOR) {
        let i, j;

        for (i = 0, j = regexsOR.length; i < j && !regexsOR[i].test(toValidate); i++);

        if (i === j) return false;
        else return true;
    },
    "removeNodesDoc": "1st param: Json Object\n2nd param: array of regularExpr to match paths to exclude. Main object represented by: root.\n3rd param: function that if true allows the omitt to do its work. In this case we ommit\n           only values that are end-nodes.",
    "removeNodes": function (obj, exclude, validateFun) {

        let _path = '';

        removeNodesImp(obj, exclude, validateFun);

        function removeNodesImp(obj, exclude, validateFun) {
            let temporalPath;
            for (let key in obj) {

                // we dont need '.' at the beginning of the root node.
                if (_path === '') temporalPath = key;
                else temporalPath = _path + "." + key;

                if (pmat.engine.testRegexsOR(temporalPath, ...exclude)) {
                    if (!validateFun) {
                        //console.log("unsetting obj[key]: " + obj[key]);
                        _.unset(obj, key);
                    } else
                        if (validateFun(obj[key])) {
                            //console.log("unsetting allowed by function");
                            _.unset(obj, key);
                        }//else console.log("unsetting NOT allowed by function");
                }

                if (typeof obj[key] === "object") {
                    // add a node to the path
                    // we dont need '.' in the root node.
                    _path = temporalPath;

                    // We call recursively passing a child node.
                    removeNodesImp(obj[key], exclude, validateFun);

                    //remove last node from the path: similar to: ../
                    _path = _path.split('.');
                    _path ? _path.pop() : console.log("It got to null");
                    _path = _path.join('.');
                }
            }
        }
    },
    "compare": function (objA, objB, excludeNodesByPath, excludeNodesIfBooleanCallback) {
        let regexsToCheck, result;

        regexsToCheck = pmat.engine.pathToRegex(...excludeNodesByPath);

        pmat.engine.removeNodes(objA, regexsToCheck, excludeNodesIfBooleanCallback);
        pmat.engine.removeNodes(objB, regexsToCheck, excludeNodesIfBooleanCallback);

        result = _.isEqualWith(objA, objB);

        return result;
    },
    "pmEnvironmentGetJSON": function (varName) {

        let toReturn = pm.environment.get(varName);

        if (toReturn !== undefined) {
            try {
                return JSON.parse(toReturn);
            } catch (e) {
                // if there is a problem parsing we return the object as it is that when exist it will be string and if not it will be undefined.
                return toReturn;
            }
        } else return toReturn;
    },
    "pmGlobalsGetJSON": function (varName) {

        //pm.globals.get returns string or undefined if not found.
        let toReturn = pm.globals.get(varName);

        if (toReturn !== undefined) {
            try {
                return JSON.parse(toReturn);
            } catch (e) {
                // if there is a problem parsing we return the object as it is that when exist it will be string and if not it will be undefined.
                return toReturn;
            }
        } else return toReturn;
    },
    "pmEnvironmentSetJSON": function (varName, obj) {
        let stringJSON;
        try {


            // stringify introduces double-quotes in string that are not needed. we skip stringify if obj is a simple string.
            if (typeof obj === 'string') stringJSON = obj;
            else stringJSON = JSON.stringify(obj);

            //console.log('setting up: ' + varName + ': ', stringJSON);

            //pmat.util.printKeysValues(pm.environment);

            // check if environment was selected
            if (!pm.environment.values.toJSON().length) throw {
                name: 'pmatSaveError',
                message: 'Tried to save in environment but no environment was selected:... could not save. ' + varName + ': ' + stringJSON
            };

            else pm.environment.set(varName, stringJSON);

            return true;
        } catch (e) {
            if (e.name === 'pmatSaveError') {
                throw e;
            } else {
                console.log('problem stringifying... stringify result: ' + stringJSON);
                return false;
            }
        }
    },
    "pmGlobalsSetJSON": function (varName, obj) {
        let stringJSON;

        try {


            // stringify introduces double-quotes in string that are not needed. we skip stringify if obj is a simple string.
            if (typeof obj === 'string') stringJSON = obj;
            else stringJSON = JSON.stringify(obj);

            pm.globals.set(varName, stringJSON);
            return true;
        } catch (e) {
            console.log('Error in pmGlobalsSetJSON');
            return false;
        }
    },
    "splitInTwoFindPrefixes": function (varName, ...prefixList) {
        let foundPrefixIndex;
        let result = [];

        foundPrefixIndex = _.findIndex(prefixList, function (o) { return varName.indexOf(o) === 0 }); // console.log('foundPrefixIndex',varName.indexOf(o));

        if (foundPrefixIndex !== -1) {
            result[0] = prefixList[foundPrefixIndex];
            result[1] = varName.substring(prefixList[foundPrefixIndex].length);
        }

        return result;

        //pmat.util.splitInTwo(varName, prefixList[foundPrefixIndex]);
    }
};


pmat.util = {
    "getValueObjDoc": "Given object and path find and return the node object in the path or null if not found",
    "getValueObj": function (obj, valuePath) {
        if (obj === undefined || obj === null || valuePath === undefined || valuePath === null) return null;

        let result = obj;

        try {
            for (let o of valuePath.split('.')) {

                if (result.hasOwnProperty(o)) result = result[o];
                else return null;
            }

            return result;
        }
        catch (e) {
            console.log('Warning: There was an exception in getValueObj(obj, valuePath)... obj: ' + obj + ' valuePath: ' + valuePath);
            return null;
        }
    },
    "setValueObj": function (obj, valuePath, value) {
        const MODIFIED = 'MODIFIED';
        const ADDED = 'ADDED';
        const CREATED = 'CREATED';
        const FAILED = 'FAILED';

        let result = obj;
        let valueReturn = FAILED;
        let valuePathArray;

        if (obj === undefined || obj === null || valuePath === undefined || valuePath === null)
        {
            throw {name:'setValueObjParamsException',msg:'obj: '+ obj + ', valuePath: ' + valuePath + ', value: ' + value};
        }

        try {
            valuePathArray = valuePath.split('.');
            for (let i = 0, j = valuePathArray.length; i < j; i++) {

                if (i === (valuePathArray.length - 1)) {
                    if (result.hasOwnProperty(valuePathArray[i])) {
                        if (valueReturn !== CREATED) valueReturn = MODIFIED;
                    } else {
                        if (valueReturn !== CREATED) valueReturn = ADDED;
                    }
                    result[valuePathArray[i]] = value;
                } else {
                    if (result.hasOwnProperty(valuePathArray[i])) {
                        result = result[valuePathArray[i]];
                    } else {
                        result[valuePathArray[i]] = {};
                        result = result[valuePathArray[i]];
                        valueReturn = CREATED;
                    }
                }
            }
            if(valueReturn === FAILED) throw {name:'setValueObjException',msg:'obj: '+ obj + ', valuePath: ' + valuePath + ', value: ' + value};
        }
        catch (e) {
            console.log(e + ' Warning: There was an exception in setValueObj(obj, valuePath, value)... obj: ' + obj + ' valuePath: ' + valuePath + ' value: ' + value);
            valueReturn = FAILED;
            return valueReturn;
        }
        //console.log('en pmat.uti setValueObj...', obj);
        return valueReturn;
    },
    "stringifyDoc": "Improve JSON.stringify() to include functions in objects",
    "stringify": function (obj, prop) {
        let placeholder = '____PLACEHOLDER____';
        let fns = [];
        let json = JSON.stringify(obj, function (key, value) {
            if (typeof value === 'function') {
                fns.push(value);
                return placeholder;
            }
            return value;
        }, 2);
        json = json.replace(new RegExp('"' + placeholder + '"', 'g'), function (_) {
            return fns.shift();
        });
        //return 'this["' + prop + '"] = ' + json + ';';
        return prop + ' = ' + json + ';';
    },
    "isValidDateYYYYMMDDHHMMSS": function (year, month, day, hour, min, sec) {
        month = month - 1;
        let d = new Date(year, month, day);
        if (d.getFullYear() == year && d.getMonth() == month && d.getDate() == day) {
            if (hour >= 0 && hour < 24 && min >= 0 && min < 60 && sec >= 0 && sec < 60)
                return true;
        }
        return false;
    },
    "isYYYYMMDDHHMMSSstr": function (x) {
        if (typeof x === "string" & x.length === 14) {
            return pmat.util.isValidDateYYYYMMDDHHMMSS(
                parseInt(x.substr(0, 4)), parseInt(x.substr(4, 2)), parseInt(x.substr(6, 2)),
                parseInt(x.substr(8, 2)), parseInt(x.substr(10, 2)), parseInt(x.substr(12, 2))
            );
        }
        return false;

    },
    "splitInTwo": function (objStr, textSearch) {
        let indexSplit, result = [];

        indexSplit = objStr.indexOf(textSearch);

        if (indexSplit === 0) {
            result[0] = textSearch;
            result[1] = objStr.substring(textSearch.length);
        }

        return result;
    },
    "printKeysValuesDoc": "Given object find and return the node object in the path or null if not found",
    "printKeysValues": function (obj) {
        let nested = '';
        consoleKeysValues(obj);
        function consoleKeysValues(obj) {
            if (obj instanceof Array) {
                for (let key = 0, maxLength = obj.length; key < maxLength; key++) {
                    //log object path.
                    //console.log(nested + key);
                    console.log(nested + key + " (" + typeof obj[key] + ")");

                    if (typeof obj[key] === "object") {
                        nested = nested + "-->";
                        consoleKeysValues(obj[key]);
                        nested = nested.slice(0, nested.length - 3);
                    } else {
                        // log value of the property
                        console.log(nested + ": " + obj[key] + " (" + typeof obj[key] + ")");
                    }
                }
            } else {
                for (let key in obj) {
                    console.log(nested + key + " (" + typeof obj[key] + ")");

                    if (typeof obj[key] === "object") {
                        nested = nested + "-->";
                        consoleKeysValues(obj[key]);
                        nested = nested.slice(0, nested.length - 3);
                    } else {
                        // log value of the property
                        console.log(nested + ": " + obj[key] + " (" + typeof obj[key] + ")");
                    }
                }
            }
        }
    },
    "pathSearchToRegex": function (pathSearch) {
        let result = pathSearch.split('.').join('[.]');
        result = result.split('*').join('[^.]*');
        result = result.split('[^.]*[^.]*').join('.*');
        result = '^' + result + '$';
        let regExToReturn = new RegExp(result);

        return regExToReturn;
    },
    "objPropsToArray": function (obj) {
        let arrayToReturn = [];
        for (let key in obj) arrayToReturn.push(key);

        return arrayToReturn;
    },
    "sleep": function (milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds) {
                break;
            }
        }
    },
    "StopWatch": function (message) {
        let timeAtStart = 0;
        let totalTime = 0;
        //initial, running, stopped
        let status = 'initial';
        let historyTimeIntervals = [];

        let calculateTotalTime = function () {
            if (status === 'running') {
                totalTime = totalTime + Date.now() - timeAtStart;
                timeAtStart = Date.now();
            }
        };

        let init = function (message) {
            timeAtStart = 0;
            totalTime = 0;
            status = 'initial';
            historyTimeIntervals = [];
            historyTimeIntervals[0] = { elapse: 0, message: message };
        };

        init(message);

        let start = function () {
            if (status === 'initial' || status === 'stopped') {
                timeAtStart = Date.now();
                status = 'running';
            }
        };

        let memorize = function (message) {
            calculateTotalTime();
            historyTimeIntervals[historyTimeIntervals.length] = { elapse: totalTime, message: message };
        };

        let stop = function () {
            calculateTotalTime();
            status = 'stopped';
        };

        let reset = function () {
            init('reset');
        };

        let show = function () {
            console.log(historyTimeIntervals);
        };

        return { start: start, memorize: memorize, show: show, stop: stop, reset: reset };
    }
};



const testCases = pmat.api.getTestCases();
pm.variables.set('testCases', testCases);

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

