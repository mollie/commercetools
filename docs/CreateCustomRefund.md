# Custom Refund

To refund part of an order, we usually use create an order refund. However, in some cases, we want to refund an arbitrary amount instead of a line, or part of a line. 

For this scenario, `createCustomRefund` should be used instead. This custom field uses mollie's create payment refund [endpoint](https://docs.mollie.com/reference/v2/refunds-api/create-payment-refund). 


## How to use

This assumes the customer has already placed an order and paid, so we need to refund money back to them. You will have a commercetools Payment, which maps to an order in mollie. If the customer's order is not paid for, then it should be canceled instead.

To trigger a custom refund, you will need to set the `createCustomRefundRequest` field on a commercetools payment. The response from this request will be saved on the `createCustomRefundResponse` custom field, and in the `interfaceInteractions`. 

(_If you want to make another custom refund against the same payment, you will need to set `createCustomRefundResponse` to `null`._)

### Example

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
    ],
    "custom": {
        "type": {
            "typeId": "type",
            "id": "dfdb9b9c-e9b2-4d06-b365-5806ee5790d6",

        },
        "fields": {
            ...
        }
    }
}
```

To refund a custom amount, we make an update payment call to commerce tools and set the custom field `createCustomRefundRequest`. For example:

```
{
    "version": 9,
    "actions": [
        {
            "action": "setCustomField",
            "name": "createCustomRefundRequest",
            "value": "{\"interactionId\": \"tr_ganTmvwJFd\", \"amount\": { \"currencyCode\": \"EUR\", \"centAmount\": 567 }, \"description\": \"Custom refund\", \"metadata\": { \"reason\": \"Demo refund\", \"code\": \"BP_13ER\"}}"
        }
    ]
}
```

If the refund is created successfully, this will add a new Transaction to your commercetools payment, to reflect the refund in mollie. For example:

```
transactions: [
    {
            id: "04adc8ad-015f-4187-ad97-9898088d3179",
            "timestamp": "2021-12-09T16:34:51.000Z",
            "type": "Refund",
            "amount": {
                "type": "centPrecision",
                "currencyCode": "EUR",
                "centAmount": 567,
                "fractionDigits": 2
            },
            "interactionId": "re_5dqyEw9xNj",
            "state": "Initial"
    },
    ...
]
```

When the refund is completed, this transaction's state will be updated by the notifications module.
