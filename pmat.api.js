'use strict'

const pmat = {}

//@deleteNextLine
const pm = require('./pm')
//@deleteNextLine
pmat.engine = require('./pmat.engine')
//@deleteNextLine
const testCases = require('./pmat.main')
//@deleteNextLine
const _ = require('lodash')

//let testCases

pmat.api= {    
    'getTestCases': function() {
        if (!pm.variables.get('flag_' + pm.info.iteration)) {
            pm.variables.set('flag_' + pm.info.iteration, true)
    
            if (pm.info.iteration === 0) {
                return {testEngineState:'newRun'}
            }else
            {
                let testCases = pm.variables.get('testCases')
                testCases.testEngineState = 'newIteration'
                return testCases
            }
        }else
        {
            let testCases = pm.variables.get('testCases')
            testCases.testEngineState = 'oldIteration'
            return testCases
        }
    },
    'loader': function () {
        if (testCases.testEngineState === 'newRun')
        { 
            // this part is only executed once per execution. pm.variables.set are stateless after execution but
            // they are stateful during the whole execution of a runner or in postman in a request.

            pmat.api.throwExceptionIfEnvNotSelected()

            console.log('starting to Load Environment: ')
            pmat.api.setTestCasesParams()
            pmat.engine.newRun()
        }

        if(testCases.testEngineState === 'newRun' || testCases.testEngineState === 'newIteration')
        {
            console.log('starting to Load Iteration: ' + pm.info.iteration)
            //pmat.api.getValidTestCases()
            pmat.engine.newIteration()
        } else console.log('Iteration: ' + pm.info.iteration + ' was previously loaded...')

        //pmat.api.getValidTestCases()

        if (pm.info.eventName === 'test' && !pm.variables.get('flagr_' + pm.info.requestId + pm.info.iteration)) {
            //console.log('flagr_' + pm.info.requestId + '-' + pm.info.iteration)
            pm.variables.set('flagr_' + pm.info.requestId + pm.info.iteration, true)

            if (testCases.record || testCases.recordIni)
            {
                console.log('Executing record...')
                pmat.api.record()
            }
            else
            {
                console.log('Executing test...')
                pmat.api.test()
            }
        }

    },
    'throwExceptionIfEnvNotSelected': function() {
        if (!pm.environment.values.toJSON().length) {
            let errorException = {
                name: 'pmatSaveError',
                message: 'environment is empty... we cancel as it looks no environment was selected and save is compromised...'
            }
            console.log(errorException)
            throw errorException
        }
    },
    'setTestCasesParams': function()
    {
        if ((typeof pm.globals.get('record') === 'boolean' && pm.globals.get('record')) || (typeof pm.globals.get('record') === 'string' && pm.globals.get('record') === 'true')) testCases.record = true
        else
        if ((typeof pm.globals.get('recordIni') === 'boolean' && pm.globals.get('recordIni')) || (typeof pm.globals.get('recordIni') === 'string' && pm.globals.get('recordIni') === 'true')) testCases.recordIni = true


        let testAtCaseList = pmat.engine.pmGlobalsGetJSON('testAtCaseList')

        testCases.testAtCaseList = []

        if (testAtCaseList) {
            if (_.isArray(testAtCaseList)) testCases.testAtCaseList = testAtCaseList
            else {
                if (testAtCaseList.indexOf(',') === -1) testCases.testAtCaseList[0] = testAtCaseList
                else console.log('ERROR!!!: globals param testAtCaseList is bad formatted. It should be JSON format. example: ["refres"]')
            }
        }

    },
    'save': function ({ varName = null, valueResponsePath = null, value = null, requestName = null } = {}) {
        try {

            return pmat.engine.save({ varName, valueResponsePath, value, requestName })
        } catch (e) {
            console.log('failed to execute pmat.egine.save: exception name: ' + e.name + ' message: ' + e.message)

            pm.test('Critital ERROR!!!! There have been exceptions... take a look to the console logs to see them...',
                function () {
                    pm.expect(0).to.equal(1)
                }
            )
            //postman.setNextRequest('pmat-end')
        }
    },
    'record': function () {

        pmat.engine.record()
    },
    'test': function () {
        pmat.engine.test()
    }
}

//@deleteNextLine
module.exports = pmat.api

