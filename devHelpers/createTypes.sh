#!/bin/bash

paymenttype='{
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
}'

interactiontype='{
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
}'
    

# Ask for CT base url, project name and token
read -p "Enter commercetools region of your project (europe-west1): " -e ctregion
read -p "Enter commercetools project name you want to create types on (mollie_integration): " -e ctproject
read -p "Enter commercetools bearer token: " -e cttoken

postlink=$(printf 'https://api.%s.gcp.commercetools.com/%s/types' "$ctregion" "$ctproject")
authHeader=$(printf 'Authorization: Bearer %s' "$cttoken")

echo $postlink
echo $authHeader

postLinkRes=$(curl --location --request POST $postlink \
--header 'Content-Type: application/json' \
--header "$authHeader" \
--data-raw "$paymenttype") 

echo $postLinkRes

interactiontypeRes=$(curl --location --request POST $postlink \
--header 'Content-Type: application/json' \
--header "$authHeader" \
--data-raw "$interactiontype") 

echo $interactiontypeRes