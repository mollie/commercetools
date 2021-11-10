# Deployment

**Work in progress**

## Environment variable

Commercetools Mollie integration requires 1 environment variable to start. This environment variable name is `CT_MOLLIE_CONFIG` and it must have keys as in a JSON structure.

Here is a table to show which environment variables are necessary, and which are optional:

| Env variable name  | Required | Notes                                                 |
| ------------------ | -------- | ----------------------------------------------------- |
| `PORT`             | NO       | Defaults to 3000 (extension) and 3001 (notifications) |
| `mollieApiKey`     | YES      |                                                       |
| `CT_MOLLIE_CONFIG` | YES      | Contains the below variables, wrapped in an object    |
| `projectKey`       | YES      | Part of CT_MOLLIE_CONFIG JSON object                  |
| `clientId`         | YES      | Part of CT_MOLLIE_CONFIG JSON object                  |
| `clientSecret`     | YES      | Part of CT_MOLLIE_CONFIG JSON object                  |
| `authUrl`          | YES      | Part of CT_MOLLIE_CONFIG JSON object                  |
| `host`             | YES      | Part of CT_MOLLIE_CONFIG JSON object                  |
| `scopes`           | NO       | Part of CT_MOLLIE_CONFIG JSON object                  |

Below is an example of how these should be formatted:

```json
{
  "PORT": 3050,
  "mollieApiKey": "mollieApiKey",
  "CT_MOLLIE_CONFIG": {
    "projectKey": "example_project_key",
    "clientId": "example_client_id",
    "clientSecret": "example_client_secret",
    "authUrl": "example_auth_url",
    "host": "example_host",
    "scopes": "example_scopes"
  }
}
```

## AWS Lambda

1. Run `npm run zip-lambda-function` from the repository root directory (where package.json is located), to zip the contents in preparation for uploading to AWS
2. An AWS lambda function should be created ([Guide to creating lambda functions](https://docs.aws.amazon.com/lambda/latest/dg/getting-started-create-function.html)). The runtime should be Node.js 14.x.
3. Upload the 'extension-module.zip' file to the lambda function (in the code section, select upload from zip file)
4. Add the environment variable `CT_MOLLIE_CONFIG` into environment variables ([Guide to adding environment variables](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-config))

## GCP functions

Setting up the extension as a google cloud function requires an existing function, setting up entry point and secrets and uploading the source code.

1. Run `npm run zip-gcp-function` from the repository root directory (where package.json is located)
2. Upload the generated zip file to your google cloud function ([Guide to creating cloud functions](https://cloud.google.com/functions/docs#training-and-tutorials))
3. Add the `CT_MOLLIE_CONFIG` to the function as `Runtime environment variables`
4. Set Runtime to `Node.js 14` and change entry point to `handler`

## Azure

// TODO

Add the following global variables into the config file:

    AZURE_FUNCTIONAPP_NAME=<>
    AZURE_FUNCTIONAPP_PACKAGE_PATH=<> _Optional_
    AZURE_FUNCTIONAPP_PUBLISH_PROFILE=<> _Optional_

## Docker

To run using a docker container, navigate to the root directory of the repository (where the Dockerfile is located) and build the container:
`docker build -t ct-mollie-extension:latest --build-arg CT_MOLLIE_CONFIG="{...}" .`
Note that the environment variables that are required should be passed with the --build-arg flag.

The port number will default to 3000 (extension module) and 3001 (notifications module). It can also be passed as an argument to the build command like so:
`docker build -t ct-mollie-extension:latest --build-arg PORT=3050 .`

After the docker image has built, you could run it with a command like the following to start the container:
`docker run -e CT_MOLLIE_CONFIG=xxxxxx --name ct-mollie-extension ct-mollie-extension:latest`

When finished, to stop the container, run:
`docker stop ct-mollie-extension`
