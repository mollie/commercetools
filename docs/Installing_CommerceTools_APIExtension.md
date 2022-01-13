# Setting up the API Extension on commercetools

**Work in progress**

## Installing API Extension

**TODO** Add installation steps here

### Authentication - HTTP Destination

For HTTP Destination API Extensions, we can add an authorization header. We use Basic authorization, configured with a username and password which is set in the environment variables.

To enable Authentication on an HTTP trigger API Extension, make sure you add the `Authorization Header` as per the docs:
https://docs.commercetools.com/api/projects/api-extensions#http-destination-authentication
Authentication configuration should also be added to `CT_MOLLIE_CONFIG` as described in [deployment docsumentation](./deployment.md)

## Configure custom fields for your project

<<<<<<< HEAD
This integration works by creating an API Extension on commercetools. This is triggered on every create and update call to Payments. It uses custom fields, which need to be created on the commercetools project.

We use Custom Fields on the Payment, Transaction, and the Payment's Interface Interaction to send data to and from Mollie. To use the API extension and notification module, you will need to install these on your Commercetools project.

In order to create these custom fields, first you should make sure your config file is correctly populated. It can be downloaded on the commercetools merchant centre when creating an API client, as shown below:

![How-To-Download-Env-Project-Variables](img/how-to-download-env-project-variables.png)

If this is not possible (for example, that your api has already been created and you have already closed this screen), you should manually create this file with the following structure:

```
CTP_PROJECT_KEY=<project_key>
CTP_CLIENT_SECRET=<client_secret>
CTP_CLIENT_ID=<client_id>
CTP_AUTH_URL=<auth_url>
CTP_API_URL=<api_url>
CTP_SCOPES=<scopes>[optional]
```

Once this file is set, you should rename it to .env and move it to the extension/ directory:

```
mv env.my-commercetools-project .env
mv .env extension/
=======
We use Custom Fields on the Payment, Transaction, and the Payment's Interface Interaction to send and store data from Mollie. To use the API extension and notification module, you will need to install these on your Commerce Tool project.

To do this, we make 3 requests to the `types` endpoint.

N.B. this list is still work in progress and will be updated as we develop.

**(1) Payment**

POST `/<project-id>/types`

Body:

```json
{
    "key": "ct-mollie-integration-payment-type",
    "name": {
        "en": "Mollie Integration payment type"
    },
    "resourceTypeIds": [
        "payment"
    ],
    "fieldDefinitions": [
        {
            "type": {
                "name": "String"
            },
            "name": "paymentMethodsRequest",
            "label": {
                "en": "Payment methods request"
            },
            "required": false,
            "inputHint": "MultiLine"
        },
        {
            "type": {
                "name": "String"
            },
            "name": "paymentMethodsResponse",
            "label": {
                "en": "Payment methods response"
            },
            "required": false,
            "inputHint": "MultiLine"
        },
        {
            "type": {
                "name": "String"
            },
            "name": "createPayment",
            "label": {
                "en": "Create payment"
            },
            "required": false,
            "inputHint": "MultiLine"
        },
        {
            "type": {
                "name": "String"
            },
            "name": "cancelPayment",
            "label": {
                "en": "Cancel payment"
            },
            "required": false,
            "inputHint": "MultiLine"
        }
    ]
}
```

**(2) Transaction:**

POST `/<project-id>/types`

Body:

```JSON
{
    "key": "ct-mollie-integration-transaction-type",
    "name": {
        "en": "Mollie Integration transaction type"
    },
    "resourceTypeIds": [
        "transaction"
    ],
    "fieldDefinitions": [
        {
            "type": {
                "name": "String"
            },
            "name": "lineIds",
            "label": {
                "en": "Line IDs and Custom Line IDs"
            },
            "required": false,
            "inputHint": "MultiLine"
        },
        {
            "type": {
                "name": "Boolean"
            },
            "name": "includeShipping",
            "label": {
                "en": "Include shipping"
            },
            "required": false,
        },
        {
            "type": {
                "name": "String"
            },
            "name": "description",
            "label": {
                "en": "Optional description for refunds"
            },
            "required": false,
            "inputHint": "SingleLine"
        },
        {
            "type": {
                "name": "String"
            },
            "name": "metadata",
            "label": {
                "en": "Optional metadata for refunds, can be string or stringified JSON"
            },
            "required": false,
            "inputHint": "MultiLine"
        }
    ]
}
>>>>>>> develop
```

Once this is done, you can call the setup custom types script by navigating to the extension/ directory and running:

```
npm run setup-types
```

You should see confirmation that 3 types, for payment, transaction and interface interaction were correctly set up.

A detailed version of the custom fields can be found in extension/custom-types.json
