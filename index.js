const AWS = require('aws-sdk')
const ddb = new AWS.DynamoDB()
const TableName = process.env.DDB_TABLE

exports.handler = (event, _, callback) => {
  const { headers, pathParameters } = event

  return new Promise((resolve, reject) => {
    typeof headers.Authorization === 'string'
      ? resolve()
      : reject({
        status: 403,
        message: 'Unauthorized'
      })
  })
    .then(() => {
      return ddb.query({
        IndexName: 'userId-index',
        TableName,
        KeyConditionExpression: 'userId = :ui',
        ExpressionAttributeValues: {
          ':ui': { S: headers.Authorization.replace('Bearer ', '') }
        }
      }).promise()
    })
    .then(({ Items }) => {
      if (!Items || !Items.length) {
        throw { status: 400, message: 'ResourceNotFound' }
      }

      let code = Items
        .filter(item => item.used.BOOL === false && item.reward.S === pathParameters.id)
        .pop().code.S

      if (!code) {
        throw { status: 400, message: 'CodeHasBeenUsed' }
      }

      return {
        status: 200,
        body: {
          status: 200,
          content: { code }
        }
      }
    })
    .catch((error = {}) => {
      return {
        status: error.status || 500,
        body: {
          status: error.status || 500,
          message: error.message || 'InternalServerError'
        }
      }
    })
    .then(({ status, body }) => callback(null, {
      statusCode: status,
      body: JSON.stringify(body),
      headers: { 'Access-Control-Allow-Origin': '*' }
    }))
}
