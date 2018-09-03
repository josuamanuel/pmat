
//@deleteNextLine
const pmat = {};
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
            if(valuReturn === FAILED) throw {name:'setValueObjException',msg:'obj: '+ obj + ', valuePath: ' + valuePath + ', value: ' + value};
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

//@deleteNextLine
module.exports = pmat.util;