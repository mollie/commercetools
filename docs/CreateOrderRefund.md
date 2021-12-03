# Order Refund

This functionality is used to refund:

- the whole order
- certain order lines
- a single or multiple items on a single order line

This calls mollie's [create order refund endpoint](https://docs.mollie.com/reference/v2/refunds-api/create-order-refund)

## How to use

In order to use this functionality, the customer must have placed an order and paid.

To trigger an order refund, the `createOrderRefundRequest` field must be set on a commercetools payment. The response from this request will be saved on the `createCustomOrderResponse` custom field, and in the `interfaceInteractions`.

## Example

Here is an example of a commercetools payment, which has been paid. Some parts have been left out for the sake of brevity:

```json
{
    "id": "53e4f484-511d-40fd-8901-69b21983ae75",
    "version": 8,
    "createdAt": "2021-11-10T13:16:19.939Z",
    "key": "ord_k5knhv",
    "amountPlanned": {
        "type": "centPrecision",
        "currencyCode": "EUR",
        "centAmount": 3700,
        "fractionDigits": 2
    },
    "paymentMethodInfo": {
        "paymentInterface": "mollie"
    },
    "custom": {
        "fields": {
            "createOrderRequest": "{}",
            "mollieOrderStatus": "paid"
        }
    },
    "paymentStatus": {},
    "transactions": [
        {
            "id": "3df5636f-1476-4e90-8b13-5a669aa83fb0",
            "timestamp": "2021-11-10T13:16:19.000Z",
            "type": "Charge",
            "amount": {
                "type": "centPrecision",
                "currencyCode": "EUR",
                "centAmount": 3700,
                "fractionDigits": 2
            },
            "interactionId": "tr_hEcj3heywU",
            "state": "Success"
        }
    ],
    "interfaceInteractions": [
        {
            "type": {
                "typeId": "type",
                "id": "4369f2e3-140c-426d-aa95-c837825f2f05"
            },
            "fields": {
                "actionType": "createOrder",
                "createdAt": "2021-11-10T13:16:19.901Z",
                "request": "{}",
                "response": "{}",
            }
        }
    ]
}
```

In order to create an order refund request, we need to update the commercetools payment to set the custom field `createOrderRefundRequest`.

Here are some examples of creating an order refund request.

To refund an entire order, leave 'lines' as an empty array:

```
{
    "version": 12,
    "actions": [
        {
            "action": "setCustomField",
            "name": "createOrderRefundRequest",
            "value": "{ \"lines\": [], \"description\": \"Refunding the whole order\", \"metadata\": {} }"
        }
    ]
}
```

Refunding a single order line:

```
{
    "version": 12,
    "actions": [
        {
            "action": "setCustomField",
            "name": "createOrderRefundRequest",
            "value": "{ \"lines\": [{ \"id\": \"odl_1.896lgp\"], \"metadata\": {\"refundId\":\"RF_281\"} }"
        }
    ]
}
```

Refunding a single item on a line ('amount' parameter is only relevant if the original item had a 'discountAmount' field that was above 0):

```
{
    "version": 12,
    "actions": [
        {
            "action": "setCustomField",
            "name": "createOrderRefundRequest",
            "value": "{ \"lines\": [{ \"id\": \"odl_1.896lgp\", \"quantity\": 1, \"amount\": { \"centAmount\": 2000, \"currencyCode\": \"EUR\" } }] }"
        }
    ]
}
```

The id within lines corresponds to the mollie order line ID.

NB - if refunding an order again on the same payment, the `createOrderRefundResponse` field must be set to `null`

If it was successful, when we check the commercetools payment, we can now see the `createOrderRefundResponse` has been updated to reflect the refund:

```
"fields": {
            "mollieOrderStatus": "paid",
            "createOrderRefundResponse": ...
            ...
}
```

As well as this, a new Transaction of type 'Refund' is created against the Payment:

```
"transactions": [
    ...
    {
        "id": "523658fb-da53-4a30-a458-e122967f1f37",
        "timestamp": "2021-11-10T13:32:03.046Z",
        "type": "Refund",
        "amount": {
            "type": "centPrecision",
            "currencyCode": "EUR",
            "centAmount": 2000,
            "fractionDigits": 2
        },
        "interactionId": "re_7TP4HebtFH",
        "state": "Initial"
    },
    ...
```
