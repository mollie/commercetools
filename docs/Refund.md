# Refund

* [Overview](#overview)
  + [Pay Later](#pay-later)
  + [Pay Now](#pay-now)
* [Parameters map](#parameters-map)
* [Example Usage](#example-usage)
* [Canceling a Refund](#canceling-a-refund)

## Overview

To refund an order, or part of an order, we create a Refund transaction. This will call mollie's create payment refund [endpoint](https://docs.mollie.com/reference/v2/refunds-api/create-payment-refund). 

This assumes the customer has already placed an order and paid, so we need to refund money back to them. To trigger a refund, you will need to create a Refund transaction, (its state should be "Initial" as per default). You can make many refunds against a Payment, but **only one refund at a time**. 

### Pay Later

_E.g. if the order was paid for using Klarna_
You can make a Refund for any amount that has been captured. If the amount you are trying to refund is not captured, (i.e. an Authorization is made, but there is no Charge transaction), then it should be [canceled](./CancelOrder.md) instead.

### Pay Now

_E.g. if the order was paid for using PayPayl_
For pay now, Refund transactions are used to trigger refunds and canceling the whole order. 

If a Refund transaction is added to an open Payment, (i.e. the customer has not paid so the Charge transaction is still Pending), this will trigger mollie's cancel order. Only whole order cancelation is possible, not partial.

If a Refund transaction is added to a paid Payment, (i.e. the Charge transaction is successful), this will trigger a refund. You can refund all or part of the total order amount.

## Parameters map

| CT Charge transaction                                  | Parameter (Mollie Order)                     | Required |
|--------------------------------------------------------|----------------------------------------------|----------|
| `custom.fields.description: "string description"`      | `description`                                | NO       |
| `custom.fields.metadata: string or stringified JSON` * | `metadata  string or JSON`                   | NO       |

`metadata` Please note, if the stringified JSON is malformed, then it will be passed to mollie as a string. 

## Example Usage

In commercetools, we have a Payment which has one Transaction. This maps to an order in mollie. The commercetools Payment's key is the mollie orderId, and the commercetools Transaction maps to the payment in mollie.

```
{
    id: "a81dfb63-0901-49c2-ba4f-141ce05119eb",
    version: 6,
    key: "ord_no74lf",
    "amountPlanned": {
        "type": "centPrecision",
        "currencyCode": "EUR",
        "centAmount": 2000,
        "fractionDigits": 2
    },
    transactions: [
        {
            id: "a71d2254-1cec-47ab-ad52-dc610ad85ffe",
            "timestamp": "2021-11-09T16:34:51.000Z",
            "type": "Charge",
            "amount": {
                "type": "centPrecision",
                "currencyCode": "EUR",
                "centAmount": 2000,
                "fractionDigits": 2
            },
            "interactionId": "tr_ganTmvwJFd",
            "state": "Success"
        }
    ]
}
```

To refund part of this, we add a Refund transaction.

```
{
    "version": 6,
    "actions": [
        {
            "action": "addTransaction",
            "transaction": {
                "type": "Refund",
                "state": "Initial",
                "amount": {
                    "currencyCode": "EUR",
                    "centAmount": 567
                },
            }
        }
    ]
}
```

If the refund is created successfully, this will update this transaction to reflect the refund in mollie. For example:

```
...
transactions: [
    {
            id: "04adc8ad-015f-4187-ad97-9898088d3179",
            "timestamp": "2021-12-09T16:34:51.000",
            "type": "Refund",
            "amount": {
                "currencyCode": "EUR",
                "centAmount": 567,
            },
            "interactionId": "re_5dqyEw9xNj",
            "state": "Pending"
    },
    ...
]
```

When the refund is completed, this transaction's state will be updated by the notifications module to "Success" or "Failure". 

You can also pass an optional description & metadata as part of the refund. This can be added using custom fields: 

```
{
    "version": 9,
    "actions": [
        {
            "action": "addTransaction",
            "transaction": {
                "type": "Refund",
                "state": "Initial",
                "amount": {
                    "currencyCode": "EUR",
                    "centAmount": 400
                },
                "description": "Refund due to late deliver",
                "metadata": "{ \"code\": \"RE_34\", \"customerRequested\": true, \"category\": \"IH_890\"}"
            }
        }
    ]
}
```

### Canceling a Refund

Canceling a refund is not yet available functionality in this integration. 

However, you can still manually cancel a refund via the mollie dashboard if needed. In this scenario, you should also manually update your Payment in commercetools to keep the data aligned. It is recommended to update your Refund transaction to "Failure" and add an note saying that this refund was cancelled. 

Example update actions: 

```
[
    {
        action: "setTransactionCustomField",
        transactionId: <refund-transaction-id>,
        name: "description",
        value: "Refund canceled manually on mollie dashboard"
    },
    {
        action: "changeTransactionState",
        transactionId: <refund-transaction-id>,
        state: "Failure"
    }
]
```
