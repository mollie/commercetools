# Deployment

  * [NodeJS Runtime](#nodejs-runtime)
  * [Environment variables](#environment-variables)
    + [Logging](#logging)
      - [Levels](#levels)
      - [Configuration](#configuration)
    + [Log transports](#log-transports)
  * [AWS Lambda](#aws-lambda)
    + [HTTP Destination & Lambda destination](#http-destination---lambda-destination)
      - [Http Destination](#http-destination)
      - [Lambda destination](#lambda-destination)
  * [GCP functions](#gcp-functions)
  * [Azure](#azure)
    + [[Config](#azureConfig)](#-config---azureconfig-)
    + [Authentication](#authentication)
      - [Azure Functions](#azure-functions)
      - [Basic](#basic)
  * [Docker](#docker)


## Prerequisites

Commands and scripts in this documentation require bash shell, nodejs with npm, zip and docker.
The recommended NodeJS runtime version is 14

## Environment variables

Commercetools Mollie integration requires 1 environment variable to start. This environment variable name is `CT_MOLLIE_CONFIG` and it must have keys as in a JSON structure.

Here is a table to show which environment variables are necessary, and which are optional:

| Env variable name  | Required | Notes                                                                                                         |
| ------------------ | -------- | ------------------------------------------------------------------------------------------------------------- |
| `CT_MOLLIE_CONFIG` | YES      | Contains the commercetools & mollie project variables                                                         |
| `mollie`           | YES      | Contains Mollie-specific project variables                                                                    |
| `apiKey`           | YES      | API key for interacting with mollie, [found on the mollie dashboard](https://www.mollie.com/dashboard/)       |
| `commercetools`    | YES      | Contains commercetools-specific project variables                                                             |
| `projectKey`       | YES      | Commercetools project key                                                                                     |
| `clientId`         | YES      | Commercetools client id, unique to the client                                                                 |
| `clientSecret`     | YES      | Commercetools client secret, unique to the client                                                             |
| `authUrl`          | YES      | Commercetools authentication URL, something like `https://auth.{LOCATION}.{CLOUD_PLATFORM}.commercetools.com` |
| `host`             | YES      | Commercetools host, something like `https://api.{LOCATION}.{CLOUD_PLATFORM}.commercetools.com`                |
| `scopes`           | NO       | Constrains endpoints the client has access to in commercetools                                                |
| `authentication`   | NO       | CommerceTools Authentication variables                                                                        |
| `isBasicAuth`      | NO       | Enable/Disable basic authentication. Default is false                                                         |
| `username`         | NO       | Username as configured in Commercetools                                                                       |
| `password`         | NO       | Password as configured in Commercetools                                                                       |
| `enableRetry`      | NO       | [Retry policy for Commercetools](https://commercetools.github.io/nodejs/sdk/api/sdkMiddlewareHttp.html#retrying-requests) on 500 or network error. Default is true                                     |
| `service`          | NO       | Contains service-specific project variables                                                                   |
| `locale`           | NO       | Locale language tag, in `aa_AA` format, based on tags mollie supports \*                                      |
| `port`             | NO       | Defaults to 3000 (extension) and 3001 (notifications)                                                         |
| `logLevel`         | NO       | Specifies how verbose logs should be. Options are listed below.                                               |
| `logTransports`    | NO       | Specifies where the logs are written to/stored. Options listed below                                          |

- Valid tags are available here on mollie's documentation under [locale](https://docs.mollie.com/reference/v2/orders-api/create-order).

Below is an example of how these should be formatted:

```json
{
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
      "scopes": "example_scopes",
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

1. Run `npm run zip-aws-lambda` from the repository root directory (where package.json is located), to zip the contents in preparation for uploading to AWS
2. An AWS lambda function should be created ([Guide to creating lambda functions](https://docs.aws.amazon.com/lambda/latest/dg/getting-started-create-function.html)). The runtime should be Node.js 14.x.
3. Upload the 'extension-module.zip' file to the lambda function (in the code section, select upload from zip file)
4. Add the environment variable `CT_MOLLIE_CONFIG` into environment variables ([Guide to adding environment variables](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-config))
5. Be aware that when adding a lambda as an extension, commercetools requires a different format than a regular HTTP. [More information can be found here](https://docs.commercetools.com/api/projects/api-extensions#aws-lambda-destination)

### HTTP Destination & Lambda destination

#### Http Destination

This configuration runs the extension via HTTP Calls. In this mode it is recommended to enable the basic authentication

```json
{
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
}
```

#### Lambda destination

This configuration runs the extension via AWS, therefore the lambda does not need to be exposed with
API Gateway.
In this scenario CommerceTools uses an IAM user to run the function,
the detailed guide is available [here](https://docs.commercetools.com/tutorials/extensions#setting-up-an-api-extension)
In this mode the basic authentication is optional.

```json
{
  "CT_MOLLIE_CONFIG": {
    "mollie": {...},
    "commercetools": {...
      "authentication": {
        "isBasicAuth": false
      }
    },
    "service": {...}
  }
}
```

## GCP functions

Setting up the extension as a google cloud function requires an existing function, setting up entry point and secrets and uploading the source code.

1. Run `npm run zip-gcp-function` from the repository root directory (where package.json is located)
2. Upload the generated zip file to your google cloud function ([Guide to creating cloud functions](https://cloud.google.com/functions/docs#training-and-tutorials))
3. Add the `CT_MOLLIE_CONFIG` to the function as `Runtime environment variables`
4. Set Runtime to `Node.js 14` and change entry point to `handler`

## Azure

1. Run `npm run zip-azure-function` from the repository root directory (where package.json is located)
2. Upload the generated zip file to your azure cloud function ([Guide to creating cloud functions](https://docs.microsoft.com/en-us/azure/azure-functions/))
3. Set Runtime to `Node.js 14` and change entry point to `handler`

Add the following global variables into the config file:

    AZURE_FUNCTIONAPP_NAME=<>
    AZURE_FUNCTIONAPP_PACKAGE_PATH=<> _Optional_
    AZURE_FUNCTIONAPP_PUBLISH_PROFILE=<> _Optional_

### [Config](#azureConfig)

[Azure config doesn't support nested json configurations](https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-node?tabs=v2#access-environment-variables-in-code)
Therefore the configuration must be defined in the same format as `local.settings.json` file

```
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "",
    "CT_MOLLIE_CONFIG:mollie:apiKey": "mollieApiKey",
    "CT_MOLLIE_CONFIG:commercetools:authUrl": "example_auth_url",
    "CT_MOLLIE_CONFIG:commercetools:clientId": "example_client_id",
    "CT_MOLLIE_CONFIG:commercetools:clientSecret": "example_client_secret",
    "CT_MOLLIE_CONFIG:commercetools:host": "example_host",
    "CT_MOLLIE_CONFIG:commercetools:projectKey": "example_project_key"
    "CT_MOLLIE_CONFIG:service:port": "example_port",
    "CT_MOLLIE_CONFIG:service:logLevel": "example_logLevel",
    "CT_MOLLIE_CONFIG:service:logTransports": "example_logTransports",
    "CT_MOLLIE_CONFIG:service:webhookUrl": "example_webhookUrl",
    "CT_MOLLIE_CONFIG:service:redirectUrl": "example_redirectUrl",
  }
}
```

### Authentication

#### Azure Functions

This method is supported as described in the following docs  
[CommerceTools Tutorial](https://docs.commercetools.com/tutorials/extensions)  
[CommerceTools Spec](https://docs.commercetools.com/api/projects/api-extensions#azure-functions-authentication)
[Azure Auth Level Docs](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook#keys)

#### Basic

This method is configurable via the following settings:

```json
{
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
}
```

## Docker

To run using a docker container, navigate to the root directory of the repository (where the Dockerfile is located) and build the container:
`docker build -t ct-mollie-extension:latest .`

The port number will default to 3000 (extension module) and 3001 (notifications module). Depending on how you run it, you might need to map the docker port to your system port.

After the docker image has built, you can now run your docker image with the following command:
`docker run -e CT_MOLLIE_CONFIG="{...}" ct-mollie-extension:latest`
Note that the environment variables that are required should be passed with the --env or -e flag. The environment variables can be found at the top of this document.

When finished, to stop the container, run:
`docker stop ct-mollie-extension`
