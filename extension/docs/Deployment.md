# Deployment

Extension module can be deployed as a function (GCP Functions, AWS Lambda, Azure Functions) or as a standalone application (Docker)

- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
  - [Logging](#logging)
    - [Levels](#levels)
    - [Configuration](#configuration)
  - [Log transports](#log-transports)
- [AWS Lambda](#aws-lambda)
  - [Lambda Authentication](#lambda-authentication)
- [GCP functions](#gcp-functions)
  - [GCP functions Authentication](#gcp-functions-authentication)
- [Azure](#azure)
  - [Azure Authentication](#azure-authentication)
- [Docker](#docker)
  - [Basic Authentication](#basic-authentication)

## Prerequisites

Commands and scripts in this documentation require bash shell, nodejs with npm, zip and docker.
The required NodeJS runtime version is 14 or higher, recommended NodeJS version is 18.

## Environment variables

Commercetools Mollie integration requires 1 environment variable to start. This environment variable name is `CT_MOLLIE_CONFIG` and it must have keys as in a JSON structure.

Here is a table to show which environment variables are necessary, and which are optional:

| Env variable name | Required | Notes                                                                                                                                                              |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `mollie`          | YES      | Contains Mollie-specific project variables                                                                                                                         |
| `apiKey`          | YES      | API key for interacting with mollie, [found on the mollie dashboard](https://www.mollie.com/dashboard/)                                                            |
| `commercetools`   | YES      | Contains commercetools-specific project variables                                                                                                                  |
| `projectKey`      | YES      | Commercetools project key                                                                                                                                          |
| `clientId`        | YES      | Commercetools client id, unique to the client                                                                                                                      |
| `clientSecret`    | YES      | Commercetools client secret, unique to the client                                                                                                                  |
| `authUrl`         | YES      | Commercetools authentication URL, something like `https://auth.{LOCATION}.{CLOUD_PLATFORM}.commercetools.com`                                                      |
| `host`            | YES      | Commercetools host, something like `https://api.{LOCATION}.{CLOUD_PLATFORM}.commercetools.com`                                                                     |
| `scopes`          | NO       | Constrains endpoints the client has access to in commercetools                                                                                                     |
| `authentication`  | NO       | CommerceTools Authentication variables                                                                                                                             |
| `isBasicAuth`     | NO       | Enable/Disable basic authentication. Default is false                                                                                                              |
| `username`        | NO       | Username as configured in Commercetools                                                                                                                            |
| `password`        | NO       | Password as configured in Commercetools                                                                                                                            |
| `enableRetry`     | NO       | [Retry policy for Commercetools](https://commercetools.github.io/nodejs/sdk/api/sdkMiddlewareHttp.html#retrying-requests) on 500 or network error. Default is true |
| `service`         | NO       | Contains service-specific project variables                                                                                                                        |
| `locale`          | NO       | Locale language tag, in `aa_AA` format, based on tags mollie supports \*                                                                                           |
| `port`            | NO       | Defaults to 3000 (extension) and 3001 (notifications)                                                                                                              |
| `logLevel`        | NO       | Specifies how verbose logs should be. Options are listed below.                                                                                                    |
| `logTransports`   | NO       | Specifies where the logs are written to/stored. Options listed below                                                                                               |

- Valid tags are available here on mollie's documentation under [locale](https://docs.mollie.com/reference/v2/orders-api/create-order).

Below is an example of how these should be formatted:

```json
"CT_MOLLIE_CONFIG": {
  "mollie": {
    "apiKey": "mollieApiKey"
  },
  "commercetools": {
    "projectKey": "example_project_key",
    "clientId": "example_client_id",
    "clientSecret": "example_client_secret",
    "authUrl": "example_auth_url",
    "host": "example_host",
    "scopes": ["example_scope:example_projectKey"],
    "authentication": {
      "isBasicAuth": true,
      "username": "username",
      "password": "password"
    },
    "enableRetry": true,
  },
  "service": {
    "port": 3050,
    "logLevel": "info",
    "logTransports": "terminal"
  }
}
```

### Logging

#### Levels

There are 6 different levels of logging available - if this isn't provided in the environment, the level will default to 'info':

- error (only errors will display)
- warn
- info
- http
- verbose
- debug (the most explicit type of logging, should be used only for testing and not for production)

#### Configuration

The application looks for the `process.env.LOG_LEVEL` for the first source of logging configuration.
If this variable is not present, it looks for `logLevel` as part of the `CT_MOLLIE_CONFIG` environment variable.
If this is also not present, it will default to "info" level.

### Log transports

Log transports are where the logs are written to. If this isn't provided in the environment, it will default to 'terminal':

- file (written to a file inside logs/ directory)
- terminal (written to STDOUT)
- all (written to both file and terminal)

## AWS Lambda

1. Run `npm run zip-aws-lambda` from the [repository root directory](../../extension), to zip the contents in preparation for uploading to AWS
2. An AWS lambda function should be created ([Guide to creating lambda functions](https://docs.aws.amazon.com/lambda/latest/dg/getting-started-create-function.html)). The runtime should be Node.js, recommended version is 18.x.
3. Upload the 'extension-module.zip' file to the lambda function (in the code section, select upload from zip file)
4. Add the environment variable `CT_MOLLIE_CONFIG` into environment variables ([Guide to adding environment variables](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-config))
5. Be aware that when adding a lambda as an extension, commercetools requires a different format than a regular HTTP. [More information can be found here](https://docs.commercetools.com/api/projects/api-extensions#awslambdadestination)

### Lambda Authentication

[Commercetools recommends using lambda authentication](https://docs.commercetools.com/api/projects/api-extensions#awslambdadestination). This configuration runs the extension via AWS, therefore the lambda does not need to be exposed with
API Gateway. In this scenario CommerceTools uses an IAM user to run the function,
the detailed guide is available [here](https://docs.commercetools.com/tutorials/extensions#setting-up-an-api-extension). Basic authentication for lambda is supported, but not recommended.

```json
"CT_MOLLIE_CONFIG": {
  "mollie": {...},
  "commercetools": {...
    "authentication": {
      "isBasicAuth": false
    }
  },
  "service": {...}
}
```

## GCP functions

Setting up the extension as a google cloud function requires an existing function, setting up entry point and secrets and uploading the source code.

1. Run `npm run zip-gcp-function` from the [repository root directory](../../extension)
2. Upload the generated zip file to your google cloud function ([Guide to creating cloud functions](https://cloud.google.com/functions/docs#training-and-tutorials))
3. Add the `CT_MOLLIE_CONFIG` to the function as `Runtime environment variables` as JSON object.
4. Set Runtime to `Node.js 18` and change entry point to `handler`

### GCP functions Authentication

We strongly recommend setting up basic authentication for GCP functions. Follow the guide for [basic authentication](#basic-authentication)

## Azure

1. Create function named `extension` based on HTTP trigger template. Set `runtime node`, `runtime-version 18` and `functions-version 4`. ([Guide to creating Azure functions](https://docs.microsoft.com/en-us/azure/azure-functions/))
2. Add the `CT_MOLLIE_CONFIG` to the functions `Application settings` as JSON object
3. Add the `WEBSITE_RUN_FROM_PACKAGE` to the functions `Application settings` and assign it value `1`
4. Run `npm run zip-azure-function-auth` from the [repository root directory](../../extension). If you do not want to have authentication enabled, (not recommended), use `npm run zip-azure-function`
5. [Deploy the generated zip file to your azure cloud function](https://learn.microsoft.com/en-us/azure/azure-functions/deployment-zip-push)

### Azure Authentication

Authentication for Azure functions is set in the `function.json` file that is added to the zip package. That happens when running `npm run zip-azure-function-auth`. When the package is deployed to Azure functions it creates function level authentication. Authentication key from function url should be used when [creating extension](./Installing_CommerceTools_APIExtension.md#azure-functions-destination). Deployment configuration object (`CT_MOLLIE_CONFIG`) does not need specific authentication property.

## Docker

To run using a docker container, navigate to the root directory of the repository (where the Dockerfile is located) and build the container:
`docker build -t ct-mollie-extension:latest .`

The port number will default to 3000 (extension module) and 3001 (notifications module). Depending on how you run it, you might need to map the docker port to your system port.

After the docker image has built, you can now run your docker image with the following command:
`docker run -e CT_MOLLIE_CONFIG="{...}" ct-mollie-extension:latest`
Note that the environment variables that are required should be passed with the --env or -e flag. The environment variables can be found at the top of this document.

When finished, to stop the container, run:
`docker stop ct-mollie-extension`

### Basic Authentication

For Docker and GCP functions it is recommended to enable the basic authentication. Authentication config can be added to `CT_MOLLIE_CONFIG` object:

```json
"CT_MOLLIE_CONFIG": {
  "mollie": {...},
  "commercetools": {...
    "authentication": {
      "isBasicAuth": true,
      "username": "username",
      "password": "password"
    }
  },
  "service": {...}
}
```
