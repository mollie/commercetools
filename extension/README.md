# API Extension

- [Local Development](#local-development)
  - [Running locally](#running-locally)
  - [Testing](#testing)

The API Extension should be deployed then installed on your commercetools project, to pass requests onto the mollie API.

For an overview of how this module works, please see the [Managing Payments](../docs/ManagingPayments.md) documentation.

## Local Development

### Running locally

To run, you will need the correct environment variables, 
as described in the [deployment guidelines](./docs/Deployment.md). 
This module expects to find a `CT_MOLLIE_CONFIG` environment variable.

Install node modules:

```
npm i
```

Run locally in develop mode:

```
npm run develop
```

Build and run locally in "production" mode:

```
npm run build
npm run start
```

### Testing

This module contains unit and component tests.

To run, first install node modules.

```
npm i
```

To run the tests, use:

```
npm run test:unit
npm run test:component

## or for watch mode
npm run test:unit -- --watch
npm run test:component -- --watch
```

For more information on component tests, see the [Readme](./tests/component/Readme.md).
