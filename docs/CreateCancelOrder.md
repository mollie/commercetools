# Cancel Order

This functionality is used to cancel:

- the whole order
- certain order lines
- a single or multiple items on a single order line

This calls mollie's endpoints [cancel order](https://docs.mollie.com/reference/v2/orders-api/cancel-order) or [cancel order lines](https://docs.mollie.com/reference/v2/orders-api/cancel-order-lines)

## How to use

In order to use this functionality, the customer must have placed an order and the status should be created, authorized or shipping.

To trigger an order cancellation, the `createCancelOrderRequest` field must be set on a commercetools payment. The response from this request will be saved on the `createCancelOrderResponse` custom field, and in the `interfaceInteractions`.

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
    "paymentMethodInfo": {},
    "custom": {
        "fields": {
            "createOrderRequest": /*...*/,
            "mollieOrderStatus": "authorized"
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
                "request": /*...*/,
                "response": /*...*/
            }
        }
    ]
}
```

In order to create a cancel order request, we need to update the commercetools payment to set the custom field `createCancelOrderRequest`.

Here are some examples of creating a cancel order request.

To cancel an entire order, provide an empty array:

```json
{
    "version": 12,
    "actions": [
        {
            "action": "setCustomField",
            "name": "createCancelOrderRequest",
            "value": "[]"
        }
    ]
}
```

Cancelling a single order line ('quantity' parameter is optional if you want to cancel part of the order line):

```json
{
    "version": 12,
    "actions": [
        {
            "action": "setCustomField",
            "name": "createCancelOrderRequest",
            "value": "[{\"id\":\"odl_1.n3xdt3\",\"quantity\":1]"
        }
    ]
}
```

Cancelling a single item on a line ('amount' parameter is only relevant if the original item had a 'discountAmount' field that was above 0):

```json
{
    "version": 12,
    "actions": [
        {
            "action": "setCustomField",
            "name": "createCancelOrderRequest",
            "value": "[{\"id\":\"odl_1.n3xdt3\",\"quantity\":2,\"amount\":{\"currencyCode\":\"EUR\",\"centAmount\":1430,\"fractionDigits\":2}}]"
        }
    ]
}
```

The id within lines corresponds to the mollie order line ID.

NB - if cancelling an order line again on the same payment, the `createCancelOrderResponse` field must be set to `null`

If it was successful, when we check the commercetools payment, we can now see the `createCancelOrderResponse` has been updated to reflect the cancellation:

```json
"fields": {
            "mollieOrderStatus": "canceled",
            "createCancelOrderResponse": /*...*/
            /*...*/
}
```
