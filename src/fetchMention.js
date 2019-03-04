const AWS = require('aws-sdk')
const ddb = new AWS.DynamoDB()
const { MentionNotFoundException } = require('./exceptions')

/**
 * @var {string} mentionsTable DynamoDB table name with mentions
 */
const mentionsTable = process.env.MENTIONS_TABLE

/**
 * @var {number} retries How many times at most can we query the db
 */
const maxRetries = process.env.MAX_RETRIES

/**
 * @var {number} delay How many milliseconds should we wait inbetween calls
 */
const delay = process.env.RETRY_DELAY

/**
 * Fetches user mentions of the promoter from the database.
 */
const fetchMention = async (handle, promoter, retries = 0) => {
  return ddb.query({
    TableName: mentionsTable,
    KeyConditionExpression: 'user = :u, promoter = :p',
    ExpressionAttributeValues: {
      ':u': { S: handle },
      ':p': { S: promoter },
    },
  }).promise()
    .then(({ Items }) => {
      if (Items && Items.length) {
        return Items.pop()
      }

      // Limit the number of retries.
      if (retries >= maxRetries) {
        throw new MentionNotFoundException(404)
      }

      // If the data could not be found, retry again in certain amount of time.
      return new Promise((resolve, reject) => setTimeout(
        () => fetchMention(handle, promoter, retries + 1)
          .then(resolve).catch(reject),
        delay,
      ))
    })
}

exports.fetchMention = fetchMention
