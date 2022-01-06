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
        },
        {
            "type": {
                "name": "String"
            },
            "name": "createRefund",
            "label": {
                "en": "Create refund"
            },
            "required": false,
            "inputHint": "MultiLine"
        },
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
    ]
}
```

**(3) Payment Interface Interaction:**

POST `/<project-id>/types`

Body:

```json
{
    "key": "ct-mollie-integration-interface-interaction-type",
    "name": {
        "en": "Mollie Integration payment interface interaction type"
    },
    "resourceTypeIds": [
        "payment-interface-interaction"
    ],
    "fieldDefinitions": [
        {
            "type": {
                "name": "String"
            },
            "name": "id",
            "label": {
                "en": "id"
            },
            "required": true,
            "inputHint": "SingleLine"
        },
        {
            "type": {
                "name": "String"
            },
            "name": "actionType",
            "label": {
                "en": "action type"
            },
            "required": true,
            "inputHint": "SingleLine"
        },
        {
            "type": {
                "name": "DateTime"
            },
            "name": "createdAt",
            "label": {
                "en": "created at"
            },
            "required": false
        },
        {
            "type": {
                "name": "String"
            },
            "name": "request",
            "label": {
                "en": "request"
            },
            "required": false,
            "inputHint": "MultiLine"
        },
        {
            "type": {
                "name": "String"
            },
            "name": "response",
            "label": {
                "en": "response"
            },
            "required": false,
            "inputHint": "MultiLine"
        }
    ]
}
```
