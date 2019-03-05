const { fetchMention } = require('./fetchMention')
const { LambdaException, RewardRedeemedException } = require('./exceptions')

/**
 * @var {number} redemptionDelay How many days user has to wait before redeeming again
 */
const redemptionDelay = Number(process.env.REDEMPTION_DELAY) * 86400

/**
 * Access headers for CORs.
 *
 * @var {object} headers
 */
const headers = {
  'Access-Control-Allow-Origin': '*',
}

exports.handler = async (event, _, callback) => {
  /**
   * @param {number} statusCode Http statusCode to return
   * @param {string} body Response body
   */
  const respond = (statusCode, body = '') => callback(null, { statusCode, body, headers })

  /**
   * @var {string} user Users Instagram handle
   *
   * @var {string} promoter Promoter that the user wants to collect a reward for
   */
  const { user, promoter } = event.pathParameters

  try {
    // If the mention could not be found, responds with 404.
    const mention = await fetchMention(user, promoter)

    const lastUsed = mention.redeemedAt ? mention.redeemedAt.N : null

    // If this is the first time user asks for redemption or they have waited
    // long enough to be able to redeem again, respond with 200.
    if (lastUsed === null || Date.now() >= Number(lastUsed) + redemptionDelay) {
      return respond(200)
    }

    // The user is not eligible to redeem.
    throw new RewardRedeemedException(403, Number(lastUsed) + redemptionDelay - Date.now())
  } catch (e) {
    if (e instanceof LambdaException) {
      return respond(e.status, e.message)
    }

    // TODO: Custom message string.
    respond(500, e.message)
  }
}
