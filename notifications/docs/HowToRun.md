# How to Run

- [How to Run](#how-to-run)
  - [Requirements on commercetools project](#requirements-on-commercetools-project)
  - [Environment Variables](#environment-variables)
    - [mollie](#mollie)
    - [commercetools](#commercetools)
    - [Extra configuration](#extra-configuration)
  - [Deployment](#deployment)
  - [AWS Lambda](#aws-lambda)
  - [GCP](#gcp)
  - [Azure](#azure)
  - [Logging](#logging)
    - [Levels](#levels)
    - [Configuration](#configuration)
    - [Log transports](#log-transports)

## Requirements on commercetools project

The notifications module works in tandem with the API Extension. It assumes this commercetools project is set up with the correct custom types, as described in API Extension's [installation guide](../../extension/docs/Installing_CommerceTools_APIExtension.md#configure-custom-fields-for-your-project).

## Environment Variables

Commercetools Mollie integration requires one environment variable to start. This environment variable name is `CT_MOLLIE_CONFIG` and it must have its keys as a JSON structure.

Here is a table to show which environment variables are necessary, and which are optional:

| Env variable name | Required | Notes                                                                                                                                                                                     |
| ----------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mollie`          | YES      | Contains Mollie-specific project variables                                                                                                                                                |
| `apiKey`          | YES      | API key for interacting with mollie                                                                                                                                                       |
| `commercetools`   | YES      | Contains commercetools-specific project variables                                                                                                                                         |
| `projectKey`      | YES      | Commercetools project key                                                                                                                                                                 |
| `clientId`        | YES      | Commercetools client id, unique to the client                                                                                                                                             |
| `clientSecret`    | YES      | Commercetools client secret, unique to the client                                                                                                                                         |
| `authUrl`         | YES      | Commercetools authentication URL, something like https://auth.{LOCATION}.{CLOUD_PLATFORM}.commercetools.com                                                                               |
| `host`            | YES      | Commercetools host, something like https://api.{LOCATION}.{CLOUD_PLATFORM}.commercetools.com                                                                                              |
| `scopes`          | YES      | Constrains endpoints the client has access to in commercetools.<br/>There MUST be a perfect match between the list of scopes provided to the user and those listed in the configurations. |
| `service`         | NO       | Contains service-specific project variables                                                                                                                                               |
| `port`            | NO       | Which port notifications should run on                                                                                                                                                    |
| `logLevel`        | NO       | Specifies how verbose logs should be. Options are listed below.                                                                                                                           |
| `logTransports`   | NO       | Specifies where the logs are written to/stored. Options listed below                                                                                                                      |

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
    "scopes": ["example_scope:example_projectKey"]
  },
  "service": {
    "port": 3050,
    "logLevel": "info",
    "logTransports": "terminal"
  }
}
```

### mollie

The mollie API key is accessible from the developer tools section of your [mollie Dashboard](https://www.mollie.com/dashboard/). You will need an account to get an API key.

### commercetools

You will need a commercetools project, with an API client. This API client will have the necessary environment variables (e.g. `clientSecret`) which should be populated in `CT_MOLLIE_CONFIG` to allow the notification module to access commercetools.

### Extra configuration

These allow you to overwrite the settings for logging and port. If not specified here, they will default to:

```
port: 3001
logLevel: "info"
logTransports: "terminal"
```

## Deployment

This project offers different deployment options. There is a [dockerfile](../Dockerfile) as well as different cloud provider handlers. Due to functionality of webhooks, notification module is expected to not have incoming authentication set up. You can read more info on webhooks from [mollie documentation](https://docs.mollie.com/overview/webhooks)

## AWS Lambda

1. Run `npm run zip-aws-lambda` from the [repository root directory](../../notifications), to zip the contents in preparation for uploading to AWS
2. An AWS lambda function should be created ([Guide to creating lambda functions](https://docs.aws.amazon.com/lambda/latest/dg/getting-started-create-function.html)). The runtime should be Node.js 18.x.
3. Upload the generated zip file to the lambda function (in the code section, select upload from zip file)
4. Add the environment variable `CT_MOLLIE_CONFIG` into environment variables ([Guide to adding environment variables](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-config))

## GCP

Setting up the extension as a google cloud function requires an existing function, setting up entry point and secrets and uploading the source code.

1. Run `npm run zip-gcp-function` from the [repository root directory](../../notifications)
2. Upload the generated zip file to your google cloud function ([Guide to creating cloud functions](https://cloud.google.com/functions/docs#training-and-tutorials))
3. Add the `CT_MOLLIE_CONFIG` to the function as `Runtime environment variables` as JSON object.
4. Set Runtime to `Node.js 18` and change entry point to `handler`

## Azure

1. Create function named `notifications` based on HTTP trigger template. Set `runtime node`, `runtime-version 18` and `functions-version 4`. ([Guide to creating Azure functions](https://docs.microsoft.com/en-us/azure/azure-functions/))
2. Add the `CT_MOLLIE_CONFIG` to the function `Application settings` as JSON object.
3. Add the `WEBSITE_RUN_FROM_PACKAGE` to the function `Application settings` and assign it value `1`
4. Run `npm run zip-azure-function` from the [repository root directory](../../notifications)
5. [Deploy the generated zip file to your azure cloud function](https://learn.microsoft.com/en-us/azure/azure-functions/deployment-zip-push)

## Logging

### Levels

There are 6 different levels of logging available - if this isn't provided in the environment, the level will default to 'info':

- error (only errors will display)
- warn
- info
- http
- verbose
- debug (the most explicit type of logging, should be used only for testing and not for production)

### Configuration

The application looks for the `process.env.LOG_LEVEL` for the first source of logging configuration.
If this variable is not present, it looks for `logLevel` as part of the `CT_MOLLIE_CONFIG` environment variable.
If this is also not present, it will default to "info" level.

### Log transports

Log transports are where the logs are written to. If this isn't provided in the environment, it will default to 'terminal':

- file (written to a file inside logs/ directory)
- terminal (written to STDOUT)
- all (written to both file and terminal)
