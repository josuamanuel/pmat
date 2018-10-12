

let pm={
    environment:
    {
        values:
        {
            toJson: function() {
                return []
            }
        },

        set: function(a,b)
        {
            a,b
        },

        get: function(a,b)
        {
            a,b
        }

    },

    variables:
    {
        set: function(a,b)
        {
            a,b
        },

        get: function(a,b)
        {
            a,b
        }

    },

    response:
    {
        json: function() {
            return {}
        },

        code: 200
    },

    info:
    {
        iteration: 1,
        iterationCount: 1,
        requestId: 'xxxx',
        eventName: 'eventName',
        requestName: 'requestName'
    },

    test: function()
    {
        return 'in test'
    },

    init: function() {
        this.test.skip = function() {return 'test skipped...'}
    }
}


module.exports = pm




