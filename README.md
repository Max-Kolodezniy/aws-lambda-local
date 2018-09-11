# aws-lambda-local
Run AWS Lambda function locally! The most lightweight library - no external dependencies. Less than 200 lines of code.

Windows, Mac and Linux tested!

## Installation
`npm install -g aws-lambda-local`

## Inputs
```
-f functionName     | --function=functionName       required       Path to Lambda function main file
-e eventPath        | --event=eventPath             optional       Path to .json file contains event object
-c contextPath      | --context=contextPath         optional       Path to .json file contains context object
-t seconds          | --timeout=seconds             optional       Force quit Lambda function after XX seconds
-h handler          | --handler=exports.handler     optional       Module.exports.handler name. Default is first function from the midule 
```

## Usage
Just specify `function name` (can be in nested directory), `event` object file.
Optionally you also may replace default `context` object and `timeout` (30 seconds by default).
```
$ cat function.js

exports.handler = function(event, context)
{
    context.done(event, context);
    // or
    return new Promise((resolve, reject) => {})
};

Or

exports.handler = function(event, context, callback)
{
    callback(null, dataToRetun);
};

Or

exports.handler = function(event)
{
    return new Promise((resolve, reject) => {})
};

Or even

exports.handler = async (event) =>
{
    return 'ret';
}

```

Check the event object. You can create any set of input data (and use them for functional testing or something else)
```
$ cat event.json
{
    "obj"   : { "a" : "b" },
    "int"   : 1,
    "str"   : "qwerty",
    "arr"   : [ 1, 2, 3, 4 ]
}

$ lambda-local -f function -e event.json -t 20
ERROR
--------------------------------
{
    "obj": {
        "a": "b"
    },
    "int": 1,
    "str": "qwerty",
    "arr": [
        1,
        2,
        3,
        4
    ]
}
OUTPUT
--------------------------------
{
    "awsRequestId": "wn26j4dm-m8zd-d7vi-j94j-50t4zsjlwhfr",
    "logGroupName": "/aws/lambda/function",
    "logStreamName": "2015/11/12/[$LATEST]wn26j4dmtm8zd7vij94j50t4zsjlwhfr",
    "functionName": "function",
    "memoryLimitInMB": "128",
    "functionVersion": "$LATEST",
    "invokedFunctionArn": "arn:aws:lambda:aws-region:1234567890123:function:function",
    "invokeId": "wn26j4dm-m8zd-d7vi-j94j-50t4zsjlwhfr"
}
```

If you missed to call context.succeed()|fail()|done() function and your Lambda function runs forever - just use `timeout` option!

Check out my [aws-lambda-build](https://www.npmjs.com/package/aws-lambda-build "https://github.com/Max-Kolodezniy/aws-lambda-build") package!
