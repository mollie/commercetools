# Creating Shipment/Capture on Mollie

Creating a shipment on mollie is only required when paying with one of the pay later methods (e.g. Klarna Pay now, Klarna Pay later). [As explained in the docs, creating a shipment creates a capture for the funds](https://docs.mollie.com/reference/v2/shipments-api/create-shipment).


**Conditions**

There should be at least one transaction type `Authorisation` with status `Success` present on the commercetools payment.
Adding new transaction type `Charge` with status `Initial` triggers create shipment. Note that **amount** of this charge transaction is **not being passed through to mollie**, so make sure that amount corresponds to the total amount of all the lines being shipped with that shipment.

Shipping the whole order simply requires adding one Charge transaction.
For shipping only certain order lines, we use custom fields on transactions. It is possible to specify which order lines, custom order lines should be charged and whether to charge shipping costs too.

<br />

## Parameters map

| CT Charge transaction                              | Parameter (Mollie Order)                     | Required |
|----------------------------------------------------|----------------------------------------------|----------|
| `custom.fields.lineIds: "lineIds" or "[array]"` *  | `lines: [array of mollieLines]`              | NO       |
| `custom.fields.includeShipping: true`              | `lines: [mollieLine type shipping_fee]`      | NO       |

\* List of commercetools line item ids and cusom line item ids. Accepts two formats:  
(1) comma separated list of ct lineIds - `"line-id-1,line-id-2"`,  
(2) stringified array of objects with id, quantity and total price - `'[{ "id": "line-id-1", "quantity": 2, "totalPrice": { "currencyCode": "EUR", "centAmount": 1000 }}]'`

<br />

## Representation: CT Payment
<details>
  <summary>Example Payment with initial charge transaction</summary>

```json
{
    "id": "c0887a2d-bfbf-4f77-8f3d-fc33fb4c0920",
    "version": 7,
    "lastMessageSequenceNumber": 4,
    "createdAt": "2021-12-16T08:21:02.813Z",
    "lastModifiedAt": "2021-12-16T08:22:28.979Z",
    "lastModifiedBy": {
        "clientId": "A-7gCPuzUQnNSdDwlOCC",
        "isPlatformClient": false
    },
    "createdBy": {
        "clientId": "A-7gCPuzUQnNSdDwlOCC",
        "isPlatformClient": false
    },
    "key": "ord_5h2f3w",
    "amountPlanned": {
        "type": "centPrecision",
        "currencyCode": "EUR",
        "centAmount": 1604,
        "fractionDigits": 2
    },
    "paymentMethodInfo": {
        "paymentInterface": "Mollie",
        "method": "ideal"
    },
    "custom": {
        "type": {
            "typeId": "type",
            "id": "c11764fa-4e07-4cc0-ba40-e7dfc8d67b4e"
        },
        "fields": {
            "createPayment": "{\"redirectUrl\":\"https://www.redirect.com/\",\"webhookUrl\":\"https://webhook.com\",\"locale\":\"nl_NL\"}"
        }
    },
    "paymentStatus": {},
    "transactions": [
        {
            "id": "869ea4f0-b9f6-4006-bf04-d8306b5c9564",
            "type": "Authorization",
            "amount": {
                "type": "centPrecision",
                "currencyCode": "EUR",
                "centAmount": 1604,
                "fractionDigits": 2
            },
            "state": "Success"
        },
        {
            "id": "ad199f53-09be-43a5-ae73-aa97248239ad",
            "type": "Charge",
            "amount": {
                "centAmount": 1604,
                "currencyCode": "EUR"
            },
            "state": "Initial",
            "custom": {
                "type": {
                    "key": "ct-mollie-integration-transaction-type"
                },
                "fields": {
                    "lineIds": "00af27cd-242c-4751-ad55-d5055ee2903d",
                    "includeShipping": true
                }
            }
        }
    ],
    "interfaceInteractions": []
}
```
</details>
<br />



## Representation: Mollie Shipment Response
<details>
  <summary>Shipment response example</summary>

```json
{
    "resource": "shipment",
    "id": "shp_if7wde",
    "orderId": "ord_5h2f3w",
    "createdAt": "2021-12-16T07:17:24+00:00",
    "lines": [
        {
            "resource": "orderline",
            "id": "odl_1.dy2xdk",
            "orderId": "ord_5h2f3w",
            "name": "Banaan",
            "metadata": {
                "cartLineItemId": "00af27cd-242c-4751-ad55-d5055ee2903d"
            },
            "quantity": 2,
            "totalAmount": {
                "value": "16.04",
                "currency": "EUR"
            },
        },
        {
            "resource": "orderline",
            "id": "odl_1.wmux1q",
            "orderId": "ord_5h2f3w",
            "name": "Shipping - Standard Shipping",
            "type": "shipping_fee",
            "metadata": null,
            "quantity": 1,
            "totalAmount": {
                "value": "0.00",
                "currency": "EUR"
            },
        }
    ]
}
```
</details>
<br />

## Creating commercetools actions from Mollie's response

When shipment is successfully created on Mollie, we update commercetools payment with following actions

| Action name (CT)                 | Value                                                                      |
| -------------------------------- | -------------------------------------------------------------------------- |
| `changeTransactionState`         | `createShipmentResponse: <transactionId>, state: 'Success'`                |
| `changeTransactionTimestamp`     | `createShipmentResponse: <createdAt>`                                      |
| `changeTransactionInteractionId` | `transactionId: <first CT transaction ID>` *                               |
|                                  | `interactionId: <UUID>`                                                    |
| `addInterfaceInteraction`        | `actionType: "createShipment"`                                             |
|                                  | `id: <UUID>`                                                               |
|                                  | `createdAt: <createShipmentResponse.createdAt>`                            |
|                                  | `request: {<CT transaction custom field in string format, transactionId>`  |
|                                  | `response: <mollieShipmentId, lineIds>`                                    |

\* Actions will always use first `Success` `Authorization` transaction. There should only be one per payment.
