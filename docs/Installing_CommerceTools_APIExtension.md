# Setting up the API Extension on commercetools

**Work in progress** 

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
            "name": "createOrderRequest",
            "label": {
                "en": "Create order request"
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
                "en": "Create order response"
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
                "en": "Create order payment request"
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
                "en": "Create order payment response"
            },
            "required": false,
            "inputHint": "MultiLine"
        },
        {
            "type": {
                "name": "String"
            },
            "name": "createShipmentRequest",
            "label": {
                "en": "Create shipment request"
            },
            "required": false,
            "inputHint": "MultiLine"
        },
        {
            "type": {
                "name": "String"
            },
            "name": "createShipmentResponse",
            "label": {
                "en": "Create shipment response"
            },
            "required": false,
            "inputHint": "MultiLine"
        },
        {
            "type": {
                "name": "String"
            },
            "name": "updateShipmentRequest",
            "label": {
                "en": "Update shipment request"
            },
            "required": false,
            "inputHint": "MultiLine"
        },
        {
            "type": {
                "name": "String"
            },
            "name": "updateShipmentResponse",
            "label": {
                "en": "Update shipment response"
            },
            "required": false,
            "inputHint": "MultiLine"
        },
        {
            "type": {
                "name": "String"
            },
            "name": "cancelOrderRequest",
            "label": {
                "en": "Cancel order request"
            },
            "required": false,
            "inputHint": "MultiLine"
        },
        {
            "type": {
                "name": "String"
            },
            "name": "cancelOrderResponse",
            "label": {
                "en": "Cancel order response"
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
