# Notification Module

Handles status updates from Mollie webhooks and passes these onto Commerce Tools.

## Commerce Tools SDK

The notification module uses Commerce Tools's [node sdk](https://commercetools.github.io/nodejs/sdk/) to make requests to CommerceTools. We are not using the V2 Typescript client as it is still in Beta.

The sdk modules do not all have types files (`d.ts`) which typescript can understand, nor a `@types/` module to install. This meant Typescript complains. To get around this, I had to add a custom `typings` folder for these modules and update our `tsconfig` to read from there as well.

The SDK also relies on `fetch`. I originally tried `node-fetch`, however this is ES module, so would not work in a commonjs project (ref: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/36539). Our `tsconfig` uses commonjs. I instead installed [node-fetch-commonjs](https://www.npmjs.com/package/node-fetch-commonjs).

## Authentication

We use the [ClientCredentials flow](https://docs.commercetools.com/api/authorization#client-credentials-flow) to authenticate with Commerce Tools. This returns an `access_token` which can be used to authenticate requests.

If you do not provide `scopes`, then all scopes are granted to the `access_token`. It's highly recommended to limit to only the scopes the Notificaitons module will need. This is [managing payments](https://docs.commercetools.com/api/scopes#manage_paymentsprojectkey).

## Running Notifications

### Environment variables

Notifications uses one environment variable `CT_MOLLIE_CONFIG`. This should be a JSON object containing:

```json
{
  "port": "3001", // optional, defaults to 3001
  "mollieApiKey": "<mollie api key>",
  "ctConfig": {
    "projectKey": "<project key>",
    "clientId": "<client id>",
    "clientSecret": "<client secret>",
    "scopes": ["array", "of", "scopes"], // optional - if not provided the access_token will have full permissions
    "authUrl": "<auth url>", // e.g. https://auth.europe-west1.gcp.commercetools.com
    "host": "<api url>" // e.g. "https://api.europe-west1.gcp.commercetools.com
  }
}
```

You can export this in your terminal using `export`, e.g:

```
export CT_MOLLIE_CONFIG='{"port":"3001","mollieApiKey":"qvvmvmf9swR4zH38Q","ctConfig":{"projectKey":"demo" ... }}'
```

### Locally

Dev mode

```
npm i
npm run develop
```

Production mode

```
npm i
npm run build
npm run start
```

### Deploying

Focus on deploying only to **GCP** Cloud Functions for test purposes.

This will need the `CT_MOLLIE_CONFIG` environment variable to your Google Cloud Function.

Package the code using `npm run zip-gcp-function` then upload.
