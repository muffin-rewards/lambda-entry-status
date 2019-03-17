# AWS Lambda: Entry Status

Checks if a user can reclaim given reward.

## Deployment
Deploy with `npm run deploy:{env}`.

### Environment variables

- `MENTIONS_TABLE` that the entries are stored in
- `MAX_RETRIES` indicates how many times do we check the DynamoDB before rejecting
- `RETRY_DELAY` how often do we retry
- `REDEMPTION_DELAY` how often can user redeem an offer from one promoter

## Responses

If handle does not exists in mentions, we return `404`.

If user has already redeemed, we return `403` with milliseconds till the request can be retried.

On unexpected server error, we return `500`.

Otherwise returns `200`.
