# Notification Module

The Notifications module handles status updates from Mollie webhooks and updates the corresponding commercetools resource.

## commercetools SDK

The notification module uses commercetools's [node sdk](https://commercetools.github.io/nodejs/sdk/) to make requests to commercetools. We are not using the V2 Typescript client yet as it is still in [beta status](https://github.com/commercetools/commercetools-sdk-typescript/issues/126).

The SDK modules do not all have types files (`d.ts`) which typescript can understand, nor a `@types/` module to install. To allow this to work with Typescript, there is the `./typings` folder for these modules. The `tsconfig` reads types from here as well as the default `node_modules` path.

The SDK also relies on `fetch`. As `tsconfig` uses `commonjs`, the `node-fetch` module will [not work in this project](https://github.com/DefinitelyTyped/DefinitelyTyped/issues/36539). Instead, we use [node-fetch-commonjs](https://www.npmjs.com/package/node-fetch-commonjs).

## Authentication

We use the [ClientCredentials flow](https://docs.commercetools.com/api/authorization#client-credentials-flow) to authenticate with commercetools. This returns an `access_token` which can be used to authenticate requests.

If you do not provide `scopes`, then all scopes are granted to the `access_token`. It's highly recommended to limit to only the scopes the Notificaitons module will need. The scope needed is [managing payments](https://docs.commercetools.com/api/scopes#manage_paymentsprojectkey).

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

Locally, you can export this in your terminal using `export`, e.g:

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

#### GCP Functions

Setting up the extension as a google cloud function requires creating a function, setting up entry point and secrets and uploading the source code.

1. Run `npm run zip-gcp-function` from the notification repository root directory (i.e. where package.json is located)
2. Upload the generated zip file to your google cloud function ([Guide to creating cloud functions](https://cloud.google.com/functions/docs#training-and-tutorials))
3. Add the `CT_MOLLIE_CONFIG` to the function as `Runtime environment variables`
4. Set Runtime to `Node.js 14` and change entry point to `handler`
