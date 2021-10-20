# Deployment

**Work in progress**

## Environment variable

commercetools Mollie integration requires 1 environment variable to start. This environment variable name is `CT_MOLLIE_CONFIG` and it must have keys as in a JSON structure below.

```json
{
    "port": 3000,
    "mollieApiKey": "mollieApiKey",
    ...
}
```

_N.B. Environment variables deployment subject to change as we're developing_

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

To run using a docker container, navigate to the root directory of the repository (where the Dockerfile is located) and build the container with:
`docker build -t ct-mollie-extension:latest .`

After the docker image has build, you could run it with a command like the following to start the container:
`docker run -e CT_MOLLIE_CONFIG=xxxxxx --name ct-mollie-extension ct-mollie-extension:latest`

When finished, to stop the container, run:
`docker stop ct-mollie-extension`
