# Making Payments using the API Extension

*WIP* 

To trigger the mollie API in commercetools, everything is done on the commercetools Payment object. 

This will have an `amountPlanned` which matches the total of the cart the customer wishes to pay for. The Payment object must be linked to its Cart object for the extension to work. The only journey which does not need the Cart linked is _list payment methods_. 

## List Payment Methods

Add a custom field on the payment object `paymentMethodsRequest`. The API extension will call mollie and return the count and available payment methods, and save this onto the custom field `paymentMethodsResponse`.

To trigger this again, (for example, if you now have more information about the location of the customer), you will need to set the `paymentMethodsResponse` field to `null`.

Example incoming payment object: 
```
{
    amountPlanned: {
        currencyCode: "EUR",
        centAmount: 5000
    }, 
    custom: {
        fields: {
            paymentMethodsRequest: "{\"locale\": \"de_DE\"}"
        }
    }
}
```

## Creating a transaction payment

The payment will be collected using mollie. For now, we are using the mollie Orders API. 

To trigger payment, first ensure the CT Payment object is linked to the correct Cart, or the API extension will return an error. 

Then, set the payment method. This must be only **one** payment method, and match the mollie payment method enums. If this is not set correctly, the API extension will return an error. 

There are two types of methods, "pay now" and "pay later". Pay now immediately takes the funds, whereas pay later means the customer is authorizing the funds. We will then need to create a capture later on to take those funds. 

We use commercetools Transactions on the Payment to trigger different actions in mollie.

### Pay now methods

For example, _iDEAL_. 

To create the payment, add a "Charge" transaction for the whole amount on your Payment object. For example: 
```
{
    amountPlanned: {
        currencyCode: "EUR",
        centAmount: 5000
    }, 
    transactions: [
        {
            type: "Charge",
            state: "Initial",
            amount: {
                currencyCode: "EUR",
                centAmount: 5000
            }
        }
    ]
}
```

This will create an order in mollie and return the response, including checkoutUrl on this Payment object. The transaction's state will be updated to "Pending", to indicate that it has been accepted by mollie.

### Pay later methods

For example, _klarnasliceit_. 

To create the authorization, add an "Authorization" transaction for the whole amount on your Payment object. For example: 
```
{
    amountPlanned: {
        currencyCode: "EUR",
        centAmount: 5000
    }, 
    transactions: [
        {
            type: "Authorization",
            state: "Initial",
            amount: {
                currencyCode: "EUR",
                centAmount: 5000
            }
        }
    ]
}
```

This will create an order in mollie and return the response, including checkoutUrl on this Payment object. The transaction's state will be updated to "Pending", to indicate that it has been accepted by mollie.

## Cancelations

### Pay later methods

To cancel an Authorization, add a "CancelAuthorization" transaction onto your Payment object. This can be either whole or partial. 

For whole, add a "CancelAuthorization" transaction for the whole amount of the order. For example: 
```
{
    amountPlanned: {
        currencyCode: "EUR",
        centAmount: 5000
    }, 
    key: "ord_1234",
    transactions: [
        {
            type: "Authorization",
            state: "Pending",
            amount: {
                currencyCode: "EUR",
                centAmount: 5000
            }
        },
        {
            type: "CancelAuthorization",
            state: "Initial",
            amount: {
                currencyCode: "EUR",
                centAmount: 5000
            }
        }
    ]
}
```

For partial, add a "CancelAuthorization" transaction for the amount you wish to cancel. You also need to provide a custom field that says which cart line items this cancelation corresponds to. Without this, the API extension will return an error. 

_example here_

## Manual Capture

This only applies to **pay later** methods. 

To capture the funds, add a "Charge" transaction to the Payment. There must already be a Successful Authorization transaction present. This will make a call to mollie's Shipment API. 

This can be done for the whole amount, or only part. 

For whole, add a "CancelAuthorization" transaction for the whole amount of the order. For example: 
```
{
    amountPlanned: {
        currencyCode: "EUR",
        centAmount: 5000
    }, 
    key: "ord_1234",
    transactions: [
        {
            type: "Authorization",
            state: "Pending",
            amount: {
                currencyCode: "EUR",
                centAmount: 5000
            }
        },
        {
            type: "Charge",
            state: "Initial",
            amount: {
                currencyCode: "EUR",
                centAmount: 5000
            }
        }
    ]
}
```

For partial, add a "Charge" transaction for the amount you wish to create a capture for. You also need to provide a custom field that says which cart line items this capture corresponds to. Without this, the API extension will return an error. 

_example here_

## Refunds

### Pay now methods

You can only refund if the initial Charge has been sucessful. 

Add a "Refund" transaction onto the Payment object. This can be for the whole, or partial amount of the Cart. 

```
{
    amountPlanned: {
        currencyCode: "EUR",
        centAmount: 5000
    }, 
    key: "ord_1234",
    transactions: [
        {
            type: "Charge",
            state: "Success",
            amount: {
                currencyCode: "EUR",
                centAmount: 5000
            }
        },
        {
            type: "Refund",
            state: "Initial",
            amount: {
                currencyCode: "EUR",
                centAmount: 3500
            }
        }
    ]
}
```

If the original Charge transaction is still pending, then the API extension call mollie to attempt to _cancel_ the payment. If this is not a cancelable payment method, it will expire within a certain timeframe. 

### Pay later methods

You can only refund if the initial Authorization has been sucessful and at least some of the funds have been captured. You can only refund money that's already captured.

Add a "Refund" transaction onto the Payment object. This can be for the whole, or partial amount of the Cart. 

```
{
    amountPlanned: {
        currencyCode: "EUR",
        centAmount: 5000
    }, 
    transactions: [
        {
            type: "Authorization",
            state: "Successful",
            amount: {
                currencyCode: "EUR",
                centAmount: 5000
            }
        },
        {
            type: "Charge",
            state: "Successful",
            amount: {
                currencyCode: "EUR",
                centAmount: 5000
            }
        },
        {
            type: "Refund",
            state: "Initial",
            amount: {
                currencyCode: "EUR",
                centAmount: 1000
            }
        }
    ]
}
```

## General Rules and error guidance

You should not create a transaction in state "Pending". This state is reserved for the API extension, to indicate that the request has been sent to mollie and accepted.

For pay now, you cannot use the transaction types "Authorization" or "CancelAuthorization", these are reserved for pay later methods.

The Payment object's key will be set to the mollie `order_id`, to link the data across the systems, once the order is made in mollie. Please do not override this value. 

Not following these guidelines will result in an error, or unexpected behaviour. 
