# Custom Refund

To refund an order, or part of an order, we create a Refund transaction. This will call mollie's create payment refund [endpoint](https://docs.mollie.com/reference/v2/refunds-api/create-payment-refund). 

## How to use

This assumes the customer has already placed an order and paid, so we need to refund money back to them. You will have a commercetools Payment, which maps to an order in mollie. If the customer's order is not paid for, (i.e. when an authorization is made, but not captured), then it should be canceled instead.

To trigger a refund, you will need to: 
- create a refund transaction (state: Initial)
- include the `interactionId` as the paymentId on mollie
(TBC - could update this to do a getOrder call, then get the mollie payment to refund against)

You can make many refunds against a Payment, but **only one refund at a time**. 

N.B. For pay now payment methods (e.g. PayPal, iDEAL), Refund transactions are used to refund and cancel orders. If a Refund transaction is added to an open payment, (i.e. the customer has not paid so the Charge transaction is still Pending), this will trigger cancel order. Only whole order cancelation is possible, not partial.

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
    ]
}
```

To refund part of this, we make an update payment call to commercetools and set the custom field `createCustomRefundRequest`. For example:

```
{
    "version": 9,
    "actions": [
        {
            "action": "addTransaction",
            "transaction": {} // add this, with custom fields
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
            "state": "Pending"
    },
    ...
]
```

When the refund is completed, this transaction's state will be updated by the notifications module to "Success" or "Failure". 
