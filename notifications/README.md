# Notification Module

The Notifications module handles status updates from Mollie webhooks and updates the corresponding commercetools resource.

For an overview of how this module works, see the [Integration Guide](./docs/IntegrationGuide.md).

To get started, see [How to Run](./docs/HowToRun.md).

## Commercetools SDK

The notification module uses commercetools's [node sdk](https://commercetools.github.io/nodejs/sdk/) to make requests to commercetools. We are not using the V2 Typescript client yet because when this project was developed, the client was still in [beta status](https://github.com/commercetools/commercetools-sdk-typescript/issues/126).

The SDK modules do not all have types files (`d.ts`) which typescript can understand, nor a `@types/` module to install. To allow this to work with Typescript, there is the `./typings` folder for these modules. The `tsconfig` reads types from here as well as the default `node_modules` path.

The SDK also relies on `fetch`. As `tsconfig` uses `commonjs`, the `node-fetch` module will [not work in this project](https://github.com/DefinitelyTyped/DefinitelyTyped/issues/36539). Instead, we use [node-fetch-commonjs](https://www.npmjs.com/package/node-fetch-commonjs).

## Commercetools Authentication

We use the [ClientCredentials flow](https://docs.commercetools.com/api/authorization#client-credentials-flow) to authenticate with commercetools. This returns an `access_token` which can be used to authenticate requests.

If you do not provide `scopes`, then all scopes are granted to the `access_token`. It's highly recommended to limit to only the scopes the Notifications module will need. The scope needed is [managing payments](https://docs.commercetools.com/api/scopes#manage_paymentsprojectkey).
