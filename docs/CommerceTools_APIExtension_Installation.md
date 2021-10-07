# Setting up API Extension on Commerce Tools

## Installing API Extension

**TODO** Add installation steps here

## Configure custom fields for your project

We use Custom Fields on the Payment, and the Payment's Interface Interaction to send and store data from Mollie. To use the API extension and notification module, you will need to install these on your Commerce Tool project.

To do this, we make two requests to the `types` endpoint.

N.B. this list is still work in progress and will be updated as we develop.

**(1) Payment**

POST `/<project-id>/types`

Body:

```
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
            "name": "mollieOrderID",
            "label": {
                "en": "Order ID from Mollie"
            },
            "required": false,
            "inputHint": "SingleLine"
        },
        {
            "type": {
                "name": "String"
            },
            "name": "mollieOrderStatus",
            "label": {
                "en": "Order status from Mollie"
            },
            "required": false,
            "inputHint": "SingleLine"
        },
        {
            "type": {
                "name": "String"
            },
            "name": "paymentMethodsRequest",
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
            "name": "paymentMethodsResponse",
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
            "name": "createOrderRequest",
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
            "name": "createOrderResponse",
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
            "name": "createOrderPaymentRequest",
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
            "name": "createOrderPaymentResponse",
            "label": {
                "en": "request"
            },
            "required": false,
            "inputHint": "MultiLine"
        }
    ]
}
```

(2) Payment Interface Interaction:

POST `/<project-id>/types`

Body:

```
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

**Todo** Add a script and / or Postman Collection for merchants to use.
