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
-n name             | --name=name                   optional       Property name for the exported Lambda function in main file
-a {true,false}     | --async={true,false}          optional       Run the function async/await handler support (see test/async.js for an example)
```

## Usage

Just specify `function name` (can be in nested directory), `event` object file.
Optionally you also may replace default `context` object and `timeout` (30 seconds by default).
```
$ cat test/function.js
exports.handler = function(event, context)
{
    context.done(event, context);
};

$ cat test/event.json
{
    "obj"   : { "a" : "b" },
    "int"   : 1,
    "str"   : "qwerty",
    "arr"   : [ 1, 2, 3, 4 ]
}

$ lambda-local -f test/function -e test/event.json -t 20
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

### Node 8.10 async/await support

AWS Lambda now supports Node 8.10 and async/await handler function ([AWS blog](https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/)). 
```
$ cat test/function.js
exports.handler = async (event) => {
  var ret = await delay(event.delay)
  return { 
    statusCode: 200,
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ "delay": ret })
  }
}

function delay(ms) {
  return new Promise(function(resolve, reject) {
    setTimeout(() => {
      resolve(`Done waiting ${ms}ms`)
    }, ms)
  })
}

$ cat test/async.event.json
{
  "delay": 50
}

$ node lambda-local.js -f test/async -e test/async.event.json -a true
OUTPUT
--------------------------------
{
    "statusCode": 200,
    "headers": {
        "content-type": "application/json"
    },
    "body": "{\"delay\":\"Done waiting 50ms\"}"
}
```
