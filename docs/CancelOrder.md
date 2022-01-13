# Cancel Order

This functionality is used to cancel:

- the whole order
- whole order lines
- part of the order line

This calls mollie's endpoints [cancel order](https://docs.mollie.com/reference/v2/orders-api/cancel-order) or [cancel order lines](https://docs.mollie.com/reference/v2/orders-api/cancel-order-lines)

<br />

**Conditions**

In order to use this functionality, the customer must have placed an order and the status should be created, authorized or shipping.

Adding new transaction type `CancelAuthorization` with status `Initial` triggers cancel order. Note that **amount** of this transaction is **not being passed through to mollie**, so make sure that amount corresponds to the total amount of all the lines being cancelled with that transaction. Custom parameters such as line item ids, quantity and amount can be added to the transaction custom fields as described below.

Cancelling the whole order simply requires adding one CancelAuthorization transaction.
For cancelling only certain order lines, we use custom fields on transactions. It is possible to specify which order lines or custom order lines should be cancelled and whether to cancel shipping costs too.

<br />

## Parameters map

| CT CancelAuthorization transaction                 | Parameter (Mollie Order)                     | Required |
|----------------------------------------------------|----------------------------------------------|----------|
| `custom.fields.lineIds: "lineIds" or "[array]"` *  | `lines: [array of mollieLines]`              | NO       |
| `custom.fields.includeShipping: true`              | `lines: [mollieLine type shipping_fee]`      | NO       |

\* List of commercetools line item ids and custom line item ids. Accepts two formats:  
(1) comma separated list of ct lineIds - `"line-id-1,line-id-2"`,  
(2) stringified array of objects with id, quantity and total price - `'[{ "id": "line-id-1", "quantity": 2, "totalPrice": { "currencyCode": "EUR", "centAmount": 1000 }}]'`

<br />

## Representation: CT Payment  

<details>
  <summary>Example Payment with initial CancelAuthorization transaction</summary>

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
            "type": "CancelAuthorization",
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

## Creating commercetools actions from Mollie's response

When order is successfully cancelled on Mollie, we update commercetools payment with following actions

| Action name (CT)                 | Value                                                                      |
| -------------------------------- | -------------------------------------------------------------------------- |
| `changeTransactionState`         | `cancelOrderResponse: <transactionId>, state: 'Success'`                   |
| `changeTransactionTimestamp`     | `cancelOrderResponse: <local timestamp>`                                   |
| `changeTransactionInteractionId` | `transactionId: <first CT transaction ID>` *                               |
|                                  | `interactionId: <UUID>`                                                    |
| `addInterfaceInteraction`        | `actionType: "cancelOrder"`                                                |
|                                  | `id: <UUID>`                                                               |
|                                  | `request: {<CT transaction custom field in string format, transactionId>`  |
|                                  | `response: 'Ok' or <lineIds>`                                              |

\* Actions will always use first `Initial` `CancelAuthorization` transaction. There should only be one per payment.  

<br />  
  
  
## Add transaction action examples  

To cancel an entire order, transaction custom fields can be left out

<details>
  <summary>Example addTransaction Action</summary>

```json
{
    "version": 11,
    "actions": [
        {
            "action": "addTransaction",
            "transaction": {
                "type": "Charge",
                "amount": {
                    "centAmount": 1104,
                    "currencyCode": "EUR"
                },
                "state": "Initial",
            }
        }
    ]
}
```  
</details>  
<br />  

To cancel the whole order line, commercetools (cart) line id can be provided as a comma separated string. Shipping costs can be cancelled by adding includeShipping

<details>
  <summary>Example addTransaction Action</summary>

```json
{
    "version": 11,
    "actions": [
        {
            "action": "addTransaction",
            "transaction": {
                "type": "Charge",
                "amount": {
                    "centAmount": 1104,
                    "currencyCode": "EUR"
                },
                "state": "Initial",
                "custom": {
                    "type": {
                        "key": "ct-mollie-integration-transaction-type"
                    },
                    "fields" :{
                        "lineIds": "00af27cd-242c-4751-ad55-d5055ee2903d,c11764fa-4e07-4cc0-ba40-e7dfc8d67b4e",
                        "includeShipping": true
                    }
                }
            }
        }
    ]
}
```  
</details>  
<br />  

Cancelling a single item on a line ('amount' parameter is only relevant if the original item had a 'discountAmount' field that was above 0)

<details>
  <summary>Example addTransaction Action</summary>

```json
{
    "version": 11,
    "actions": [
        {
            "action": "addTransaction",
            "transaction": {
                "type": "Charge",
                "amount": {
                    "centAmount": 1104,
                    "currencyCode": "EUR"
                },
                "state": "Initial",
                "custom": {
                    "type": {
                        "key": "ct-mollie-integration-transaction-type"
                    },
                    "fields" :{
                        "lineIds": "[{\"id\":\"bfa19843-582e-4ba0-b72b-8e1ce156ad56\",\"quantity\": 2,\"totalPrice\": {\"currencyCode\": \"EUR\",\"centAmount\": 500,\"fractionDigits\": 2 }}]",
                        "includeShipping": false
                    }
                }
            }
        }
    ]
}
```  
</details>
