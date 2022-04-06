# Managing Payments through API Extension

- [Available Functionality](#available-functionality)
- [Terminology](#terminology)
- [How it works](#how-it-works)
  - [Cart setup](#cart-setup)
  - [List Payment Methods](#list-payment-methods)
  - [Making a payment](#making-a-payment)
    - [Pay later](#pay-later)
    - [Pay now](#pay-now)
  - [Cancelations](#cancelations)
  - [Manual Capture](#manual-capture)
  - [Refunds](#refunds)
    - [Pay now methods](#pay-now-methods)
    - [Pay later methods](#pay-later-methods)
- [General Rules and error guidance](#general-rules-and-error-guidance)
  - [Payment](#payment)
  - [Transactions](#transactions)
  - [Errors](#errors)

## Available Functionality

This integration includes the following functionality:

- list payment methods
- make a payment
- authorize funds
- capture funds
- cancel authorization
- cancel order
- refund

## Terminology

**Pay later** refers to payment methods which authorize then capture funds, e.g. Klarna

**Pay now** refers to payment methods which take the funds immediately, e.g. iDEAL.

## How it works

You will need the [API Extension](../extension/Readme.md) and [notifications module](../notifications/Readme.md) installed and configured.

The extension uses mollie's [orders API](https://docs.mollie.com/reference/v2/orders-api/overview) to make payments. It is triggered by create and update requests on commercetools [Payments](https://docs.commercetools.com/api/projects/payments).

The extension checks every incoming payment request for payment interface name, which must be set to `Mollie`.

### Cart setup

On your webshop, a customer will add items to their basket. This is reflected in a [Cart](https://docs.commercetools.com/api/projects/carts) on commercetools. Before checkout, make sure the Cart is up to date, including shipping information and amount. The lines and totals in the Cart are used to make the order in mollie.

In order to checkout, this Cart needs to be linked to a Payment. This Payment should have `amountPlanned` set to the total amount of the Cart. It must also have its [payment method interface](https://docs.commercetools.com/api/projects/payments#paymentmethodinfo) must be set to "mollie", (this is to allow for other API extensions on the same commercetools project, and prevent unintended updates).

### List Payment Methods

You can get available payment methods by using the custom field `paymentMethodsRequest` on the Payment object. The extension will call mollie and return the count and available payment methods, and save this onto the custom field `paymentMethodsResponse`.

To trigger this again, (for example, if you now have more information about the location of the customer), you will need to reset the `paymentMethodsResponse` field to `null`.

Example incoming payment object:

```
{
    amountPlanned: {
        currencyCode: "EUR",
        centAmount: 5000
    },
    "paymentMethodInfo": {
        "paymentInterface": "Mollie"
    },
    custom: {
        fields: {
            paymentMethodsRequest: "{\"locale\": \"de_DE\"}"
        }
    }
}
```

Example payment object with response:

```
{
    amountPlanned: {
        currencyCode: "EUR",
        centAmount: 5000
    },
    "paymentMethodInfo": {
        "paymentInterface": "Mollie"
    },
    custom: {
        fields: {
            paymentMethodsRequest: "{\"locale\": \"de_DE\"}",
            paymentMethodsResponse: ""
        }
    }
}
```

#### Parameters - list payment methods

| Parameter                                  | Structure               | Required |
| ------------------------------------------ | ----------------------- | -------- |
| Amount planned for payment (amountPlanned) | JSON object             | YES      |
| paymentMethodsRequest for custom fields    | stringified JSON object | YES      |
| paymentMethodInfo.paymentInterface         | string === `Mollie`     | YES      |

The `paymentMethodsRequest` field must be present for the extension to trigger mollie's list of available payment methods. If no custom fields are required, this field must be present as an empty object.

Inside `paymentMethodsRequest`, we can pass custom fields to the extension, to pass along to mollie:

| Parameter           | Type    | Example/more info                                                                                                       |
| ------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------- |
| locale              | string  | [See Mollie's list of accepted locale values](https://docs.mollie.com/reference/v2/methods-api/list-methods#parameters) |
| billingCountry      | string  | [Billing country in ISO3166-1 format](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)                                 |
| includeWallets      | string  | applepay                                                                                                                |
| orderLineCategories | string  | meal, eco, gift                                                                                                         |
| issuers             | boolean | true                                                                                                                    |
| pricing             | boolean | true                                                                                                                    |
| sequenceType        | string  | first, recurring                                                                                                        |

For more information about these fields, refer to [Mollie's list payment methods documentation](https://docs.mollie.com/reference/v2/methods-api/list-methods).

### Making a payment

To create an order in mollie, you must add a [Transaction](https://docs.commercetools.com/api/projects/payments#transaction) to the Payment. You must also set the payment method that the customer wishes to use.

This will create the order in mollie and save response details onto an `interfaceInteraction` on the Payment. For full details on making a payment, see the [create order](./CreateOrder.md) documentation.

#### Pay later

If the customer wishes to pay with a "pay later" method, then an Authorization transaction should be added. The funds will then be captured using "Charge" transactions.

#### Pay now

If the customer wishes to pay with a "pay now" method, then an Charge transaction should be added.

### Cancelations

If the customer changes their mind, you can cancel the order, or part of the order, depending on the payment method.

For full details, see the [cancel order](./cancelOrder.md) docs.

### Manual Capture

This only applies to **pay later** methods.

Once a payment has been `authorized`, you will need to capture the funds. To do so, add a "Charge" transaction to the Payment, which will make a call to mollie's Shipment API.

This can be done for the whole amount, or only part of the order.

For full details, see the [manual capture](./createShipment.md) docs.

### Refunds

This uses mollie's [create payment refund](https://docs.mollie.com/reference/v2/refunds-api/create-payment-refund) endpoint. For full details, see the [refund](./Refund.md) docs.

#### Pay now methods

You can only refund if the initial Charge has been sucessful. Add a "Refund" transaction onto the Payment object. This can be for the whole, or partial amount of the Cart.

If the original Charge transaction is still pending, then the API extension will make a call to mollie to attempt to _cancel_ the payment. Only some payment types are cancelable. If the payment method is not cancelable, you will receive an error message.

Non-cancelable payment methods will simply expire after a certain timeframe. You can see this when the transaction state is updated to "Failure".

#### Pay later methods

You can only refund if the initial Authorization has been sucessful and at least some of the funds have been captured. Only captured funds can be refunded.

Add a "Refund" transaction onto the Payment object. This can be for the whole, or partial amount of the Cart.

## General Rules and error guidance

Not following these guidelines may result in an error, or unexpected behaviour.

### Carts and Orders on commercetools

An Order can be created from a Cart on commercetools. This integration expects the Order to be created from the Cart **after** the Cart has been used to trigger payment in mollie.

### Payment

The Payment object's key will be set to the mollie `order_id`, to link the data across the systems, once the order is made in mollie. Please do not override this value.

### Transactions

The API extension only allows one Transaction in an `Initial` state at a time. If you add multiple `Initial` tranasactions, it will return an error.

This is to allow each action to be processed and the data's state to "settle" before trying to process the next.

You should not create a transaction in state "Pending". This state is reserved for the API extension, to indicate that the request has been sent to mollie and accepted.

For pay now, you cannot use the transaction type "CancelAuthorization" as this is reserved for pay later methods.

### Errors

If an error occurs, you will receive a 400 response and an error message. This means commercetools will not persist the result of the original call, (see the [API Extension documentation](https://docs.commercetools.com/api/projects/api-extensions#the-api-extension-within-the-flow-of-the-api-call) for more details).

If the mollie API returns an error, this message will be returned within the `extraInfo` section of the error response. This will include the reason, field (if applicable) and links to the appropriate mollie documentation.
