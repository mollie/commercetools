# How to run

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Environment variable](#environment-variable)
    - [Mollie](#MOLLIE)
    - [commercetools](#commercetools)
    - [Other Configurations](#other-configurations)
    - [External file configuration](#external-file-configuration)
- [Commercetools project requirements](#commercetools-project-requirements)
- [Other requirements](#other-requirements)
    - [Affirm payment](#affirm-payment)
- [Running](#running)
    - [Docker](#docker)
        - [Running the Docker image](#running-the-docker-image)
- [Deployment](#deployment)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Environment variable

Extension module requires 1 environment variable to start, and it must contain settings as attributes in a JSON structure.

```json
{
  "mollie":{
    "apiKey":"API_KEY"
  },
  "commercetools":{
    "authUrl":"AUTH_URL",
    "clientId":"CLIENT_ID",
    "clientSecret":"CLIENT_SECRET",
    "host":"HOST_URL",
    "projectKey":"PROJECT_KEY"
  }
}
```

The JSON structure will be described in details in the next sections of this documentation.

### Mollie

[APO documentation](https://docs.mollie.com) for details.

```
{
  "mollie":{
    "apiKey":"API_KEY"
  }
}
```

| Name     | Content                                                                                                                                                  | Required |
|----------| -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `apiKey` | You'll be making API requests that are authenticated with an [API key](https://help.mollie.com/hc/en-us/articles/115000328205-Where-can-I-find-the-API-key-). | YES |                                                                                                                                                                                |

### commercetools

If you don't have the commercetools OAuth credentials,[create a commercetools API Client](https://docs.commercetools.com/getting-started.html#create-an-api-client).

> Note that, extension module requires `manage_payments, view_orders` [scopes](https://docs.commercetools.com/http-api-scopes) for the integration and `manage_types, manage_extensions` [scopes](https://docs.commercetools.com/http-api-scopes) for setting up required resources.

Multiple child attributes can be provided in the `commercetools` attribute. Each direct child attribute must represent 1 commercetools project like in the following example:

```
{
  "commercetools":{
    "authUrl":"AUTH_URL",
    "clientId":"CLIENT_ID",
    "clientSecret":"CLIENT_SECRET",
    "host":"HOST_URL",
    "projectKey":"PROJECT_KEY"
  }
}
```

| Name             | Content                                                                                                                                                                                                                                                                                                                                                                                                      | Required | Default value                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------- |
| `clientId`       | OAuth 2.0 `client_id` and can be used to obtain a token.                                                                                                                                                                                                                                                                                                                                                     | YES      |                                                   |
| `clientSecret`   | OAuth 2.0 `client_secret` and can be used to obtain a token.                                                                                                                                                                                                                                                                                                                                                 | YES      |                                                   |
| `apiUrl`         | The commercetools HTTP API is hosted at that URL.                                                                                                                                                                                                                                                                                                                                                            | NO       | `https://api.europe-west1.gcp.commercetools.com`  |
| `authUrl`        | The commercetools’ OAuth 2.0 service is hosted at that URL.                                                                                                                                                                                                                                                                                                                                                  | NO       | `https://auth.europe-west1.gcp.commercetools.com` |



## Commercetools project requirements (TODO - DESCRIBE HERE ALL THE CUSTOM CONFIG)

Resources below are required for the extension module to operate correctly.

1. [The commercetools HTTP API Extension pointing to MOLLIE extension module](../resources/api-extension.json)
   > It's required that the HTTP API Extension timeout limit is increased to 10000 milliseconds (default is 2000). Please contact Support via the commercetools [support portal](https://support.commercetools.com/) and provide the region, project key, and use case to increase the timeout to 10000 ms. Additionally, after the limit increased, timeout might be updated over API with [setTimeoutInMs](https://docs.commercetools.com/http-api-projects-api-extensions#set-timeoutinms) action.
1. [Payment custom type](../resources/web-components-payment-type.json)
1. [Payment-interface-interaction custom type](../resources/payment-interface-interaction-type.json)

First, you will need to configure [ExtensionDraft](../resources/api-extension.json) destination according to your deployment.
A destination contains all info necessary for the commercetools platform to call the extension module. Please follow the [commercetools HTTP API Extension](https://docs.commercetools.com/api/projects/api-extensions#destination) documentation for details.

After you change the destination, you can set up required resources in your commercetools projects by running the script `npm run setup-resources`, the script requires the `MOLLIE_INTEGRATION_CONFIG` to be set as an environment variable.

```bash
export MOLLIE_INTEGRATION_CONFIG=xxxx
npm run setup-resources
```

## Other requirements


### Affirm payment (TODO - Is there a similar api in Mollie?)

Please run following CURL command in order to list out all payment methods in US supported by your Mollie account.`
Make sure Affirm payment is inside the response.

```bash
curl https://api-address.foo \
-H "x-API-key: YOUR_MOLLIE_X-API-KEY" \
-H "content-type: application/json" \
-d '{
  "merchantAccount": "YOUR_MOLLIE_MERCHANT_ACCOUNT",
  "countryCode": "US",
  "amount": {
    "currency": "USD",
    "value": 1000
  },
  "channel": "Web",
  "shopperLocale": "us-US"
}'
```

If Affirm payment is not supported, please contact MOLLIE technical support and provide all following information :

- Affirm payment account public API key
- Affirm payment account ARI

MOLLIE makes use of the provided credential to integrate your account to Affirm payment platform.

For more details about Affirm credential, please visit the [Affirm doc](https://docs.affirm.com/affirm-developers/docs/api-keys) and contact Affirm support through it.

## Running(TODO: check if the configuration with env variable is working)

### Docker

Refer to our [docker hub](https://hub.docker.com/r/commercetools/commercetools-MOLLIE-integration-extension/tags) page to see the latest releases and tags.

#### Running the Docker image

```bash
    docker run \
    -e MOLLIE_INTEGRATION_CONFIG=xxxxxx \
    commercetools/commercetools-MOLLIE-integration-extension:vX.X.X
```

## Deployment

Extension module supports different deployment [options](/deployment-examples).
It could be either hosted on-premises (run docker containers behind the load balancer) or
deployed as a serverless application.