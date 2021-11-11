# Deployment

**Work in progress**

## Environment variables

Commercetools Mollie integration requires 1 environment variable to start. This environment variable name is `CT_MOLLIE_CONFIG` and it must have keys as in a JSON structure.

Here is a table to show which environment variables are necessary, and which are optional:

| Env variable name  | Required | Notes                                                                                                       |
| ------------------ | -------- | ----------------------------------------------------------------------------------------------------------- |
| `PORT`             | NO       | Defaults to 3000 (extension) and 3001 (notifications)                                                       |
| `LOG_LEVEL`        | NO       | Specifies how verbose logs should be. Options are listed below.                                             |
| `LOG_TRANSPORTS`   | NO       | Specifies where the logs are written to/stored. Options listed below                                        |
| `CT_MOLLIE_CONFIG` | YES      | Contains the commercetools & mollie project variables                                                       |
| `ctConfig`         | YES      | Contains commercetools-specific project variables                                                           |
| `mollieApiKey`     | YES      | API key for interacting with mollie                                                                         |
| `projectKey`       | YES      | Commercetools project key                                                                                   |
| `clientId`         | YES      | Commercetools client id, unique to the client                                                               |
| `clientSecret`     | YES      | Commercetools client secret, unique to the client                                                           |
| `authUrl`          | YES      | Commercetools authentication URL, something like https://auth.{LOCATION}.{CLOUD_PLATFORM}.commercetools.com |
| `host`             | YES      | Commercetools host, something like https://api.{LOCATION}.{CLOUD_PLATFORM}.commercetools.com                |
| `scopes`           | NO       | Constrains endpoints the client has access to in commercetools                                              |

<!-- Notes - describe env, not structure in json -->

Below is an example of how these should be formatted:

```json
{
  "PORT": 3050,
  "LOG_LEVEL": "info",
  "LOG_TRANSPORTS": "all",
  "CT_MOLLIE_CONFIG": {
    "mollieApiKey": "mollieApiKey",
    "ctConfig": {
      "projectKey": "example_project_key",
      "clientId": "example_client_id",
      "clientSecret": "example_client_secret",
      "authUrl": "example_auth_url",
      "host": "example_host",
      "scopes": "example_scopes"
    }
  }
}
```

### Log levels

There are 6 different levels of logging available - if none are selected, the level will default to 'info':

- error (only errors will display)
- warn
- info
- http
- verbose
- debug (the most explicit type of logging, should be used only for testing and not for production)

### Log transports

Log transports are where the logs are written to:

- file (written to a file inside logs/ directory)
- terminal (written to STDOUT)
- all (written to both file and terminal)

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
`docker build -t ct-mollie-extension:latest .`

The port number will default to 3000 (extension module) and 3001 (notifications module). It can also be passed as an argument to the build command like so:
`docker build -t ct-mollie-extension:latest --build-arg PORT=3050 .`

After the docker image has built, you can now run your docker image with the following command:
`docker run -e CT_MOLLIE_CONFIG="{...}" ct-mollie-extension:latest`
Note that the environment variables that are required should be passed with the --env or -e flag. The environment variables can be found at the top of this document.

When finished, to stop the container, run:
`docker stop ct-mollie-extension`
