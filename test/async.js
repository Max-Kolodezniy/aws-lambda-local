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