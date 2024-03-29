# Create Order Payment

  * [Overview](#overview)
  * [Parameters map](#parameters-map)
  * [Representation: CT Payment](#representation-ct-payment)
  * [Creating commercetools actions from Mollie's response](#creating-commercetools-actions-from-mollies-response)

## Overview

This functionality is used to add a payment or change the payment method to existing order on Mollie:

This calls Mollie's [create order payment](https://docs.mollie.com/reference/v2/orders-api/create-order-payment) endpoint.

<br />

**Conditions**

To use this functionality, the order (on Mollie) must already exist. The customer must have tried and failed paying - i.e. none of the commercetools transactions can have status `Pending` or `Success`.

Adding a new transaction to an existing order with status `Initial` triggers create order payment. The transaction type should align with the payment method, e.g. `Authorization` for `klarnapaylater` and `Charge` for `ideal`. 

Note that **amount** of this transaction is **not being passed through to Mollie**. Payment method is required and always passed though to Mollie.


<br />

## Parameters map

| CT `Authorization` or `Charge` transaction         | Parameter (Mollie Order)                     | Required |
|----------------------------------------------------|----------------------------------------------|----------|
| `key: "ord_123456"`                                | `orderId: "ord_123456"`                      | YES      |
| `paymentMethodInfo.method: "ideal"`                | `method: ideal`                              | YES      |


<br />

## Representation: CT Payment  

<details>
  <summary>Example Payment triggering Create order payment</summary>

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
            "state": "Failure"
        },
        {
            "id": "ad199f53-09be-43a5-ae73-aa97248239ad",
            "type": "Charge",
            "amount": {
                "centAmount": 1604,
                "currencyCode": "EUR"
            },
            "state": "Initial"
        }
    ],
}
```
</details>
<br />

## Creating commercetools actions from Mollie's response

When create order payment is successfully added on Mollie, we update commercetools payment with following actions

| Action name (CT)                 | Value                                                                      |
| -------------------------------- | -------------------------------------------------------------------------- |
| `changeTransactionState`         | `createOrderPaymentResponse: <transactionId>, state: 'Pending'`            |
| `changeTransactionTimestamp`     | `createOrderPaymentResponse: <createdAt>`                                  |
| `changeTransactionInteractionId` | `transactionId: <initial CT transaction ID>` *                             |
|                                  | `interactionId: <mollie payment ID>`                                       |
| `addInterfaceInteraction`        | `actionType: "CreateOrderPayment"`                                         |
|                                  | `id: <UUID>`                                                               |
|                                  | `timestamp: <createdAt>`                                                   |
|                                  | `requestValue: {<transactionId, paymentMethod>`                            |
|                                  | `responseValue: <molliePaymentId, checkoutUrl, transactionId>`             |

\* Actions will always use first `Initial` transaction. There should only be one per payment. Transaction id will be the ID of the transaction which triggered the create order payment.

