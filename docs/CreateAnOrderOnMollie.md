## Creating an Order on Mollie

**Work in progress**

To create an order on Mollie, we need to have a minimum number of parameters on commercetools. These will get converted on Mollie. Below are some conversion tables, as well as JSON representations of the calls being mapped from commercetools to Mollie.
All requests to extension module require payment interface set to `mollie`

# createPaymentRequest object (req.body.resource.obj.custom.fields.createPaymentRequest)

| Parameter (CT)                                                     | Parameter (Mollie)                               | Required |
| ------------------------------------------------------------------ | ------------------------------------------------ | -------- |
| `orderNumber: 10920`                                               | `orderNumber: 10920 `                            | YES      |
| `orderWebhookUrl: "https://www.examplewebhook.com"`                | `webhookUrl: "https://www.examplewebhook.com"`   | YES      |
| `redirectUrl: "https://www.exampleredirect.com"`                   | `redirectUrl: "https://www.exampleredirect.com"` | YES      |
| `locale: nl_NL`                                                    | `locale: nl_NL`                                  | YES      |
| `shopperCountryMustMatchBillingCountry: false`                     | `shopperCountryMustMatchBillingCountry: false`   | NO       |
| `expiresAt: "2021-12-25"`                                          | `expiresAt: '2021-12-25'`                        | NO       |
| `billingAddress: [billingAddress]`                                 | `billingAddress: [billingAddress]`               | YES      |
| `shippingAddress: [billingAddress]`                                | `shippingAddress: [shippingAddress]`             | NO       |
| `lines: [array of lines]`                                          | `lines: [array of lines]`                        | YES      |
| `metadata: {}`                                                     | `metadata: {}`                                   | NO       |
| `vatRate: 0.2`                                                     | `vatRate: 20.00 `                                | YES      |
| `vatAmount: { value: { currencyCode: "EUR", centAmount: "200" } }` | `vatAmount: { currency: "EUR", value: "2.00" } ` | YES      |

# lines object (inside createPaymentRequest object)

| Parameter (CT)                                                           | Parameter (Mollie)                                                        | Required |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------- | -------- |
| `name: { en: "apple" }`                                                  | `name: apple `                                                            | YES      |
| `quantity: 1`                                                            | `quantity: 1 `                                                            | YES      |
| `type: [OrderLineType]`                                                  | `type: [OrderLineType] `                                                  | NO       |
| `discountAmount: { value: { currencyCode: "EUR", centAmount: 1000 } }`   | `discountAmount: { value: { currency: "EUR", value: "10.00" } } `  ¤      | NO       |
| `sku: SKU12345`                                                          | `sku: SKU12345 `                                                          | NO       |
| `imageUrl: "https://image-url.com/"`                                     | `imageUrl: "https://image-url.com/" `                                     | NO       |
| `productUrl: "https://image-url.com/"`                                   | `productUrl: "https://image-url.com/" `                                   | NO       |
| `metadata: { extraData: "some extra stuff" }`                            | `metadata: { extraData: "some extra stuff" }`                             | NO       |
| `price: { value: { currencyCode: "EUR", centAmount: "1000" } }`          | `unitPrice: { currency: "EUR", value: "10.00" } `                         | YES      |

¤ For more information on how to pass this, see mollie's [handling discounts](https://docs.mollie.com/orders/handling-discounts) documentation.

N.B. The line's total price is calculated by using `( unitprice * quantity ) - discountAmount`

# billingAddress/shippingAddress object (inside createPaymentRequest object)

| Parameter (CT)                                | Parameter (Mollie)                            | Required |
| --------------------------------------------- | --------------------------------------------- | -------- |
| `firstName: "Piet"`                           | `givenName: "Piet" `                          | YES      |
| `lastName: "Mondriaan"`                       | `familyName: "Mondriaan" `                    | YES      |
| `email: "coloured_square_lover@basicart.com"` | `email: "coloured_square_lover@basicart.com"` | YES      |
| `streetName: "Keizersgracht"`                 | `streetAndNumber: "Keizersgracht 126" `       | YES      |
| `streetNumber: "126"`                         |                                               | YES      |
| `postalCode: "1234AB"`                        | `postalCode: "1234AB"`                        | YES      |
| `country: "NL"`                               | `country: "NL" `                              | YES      |
| `city: "Amsterdam"`                           | `city: "Amsterdam"`                           | YES      |

To create an order, you do not need to provide a billing/shipping address. However, if provided, all the fields (eg firstName, streetNumber) must also be provided.

# OrderLineType enum

One of:

- physical
- discount
- digital
- shipping_fee
- store_credit
- gift_card
- surcharge

# amoundPlanned object (req.body.resource.obj.amountPlanned)

| Parameter (CT)     | Parameter (Mollie) |
| ------------------ | ------------------ |
| `centAmount: 1000` | `value: "10.00"`   |
| `currency: "EUR"`  | `currency: "EUR"`  |

# paymentMethodInfo object (req.body.resource.obj.paymentMethodInfo)

| Parameter (CT)                | Parameter (Mollie)                 |
| ----------------------------- | ---------------------------------- |
| `paymentInterface: "mollie"`  | -                                  |
| `method: "creditcard,paypal"` | `method: ['creditcard', 'paypal']` |

The `PaymentMethodInfo.methods` is a comma separated string of [mollie payment methods](https://docs.mollie.com/reference/v2/orders-api/create-order), used to limit the payment methods a customer can use at checkout. If not provided, or provided as `''`, all payment methods will be available to the customer. If the payment method is not enabled in your website profile, you will receive an error.

# Representation: CT create payment

```
{
    custom: {
        fields: {
                "createPayment": "{\"description\":\"Payment description\",\"redirectUrl\":\"https:\/\/www.redirectUrl.com\/\",\"webhookUrl\":\"https:\/\/www.webhookUrl.com\",\"locale\":\"nl_NL\",\"locale\":\"nl_NL\"}",
            }
        },
    amountPlanned: {
        currencyCode: "EUR",
        centAmount: 1000
    },
    paymentMethodInfo: {
        method: "CREDIT_CARD"
    }
}
```

# Representation: Mollie

```
{
    amount: { value: '10.00', currency: 'EUR' },
    orderNumber: "1001",
    webhookUrl: "https://www.examplewebhook.com/",
    locale: "nl_NL",
    redirectUrl: "https://www.exampleredirect.com/",
    method: "creditcard",
    shopperCountryMustMatchBillingCountry: false,
    billingAddress: {
        streetAndNumber: 'Keizersgracht 126',
        city: 'Amsterdam',
        postalCode: '1234AB',
        country: 'NL',
        givenName: 'Piet',
        familyName: 'Mondriaan',
        email: 'piet@mondriaan.com'
    },
    shippingAddress: {
        streetAndNumber: 'Keizersgracht 126',
        city: 'Amsterdam',
        postalCode: '1234AB',
        country: 'NL',
        givenName: 'Piet',
        familyName: 'Mondriaan',
        email: 'piet@mondriaan.com'
    },
    lines: [{
        name: "apple",
        quantity: 1,
        unitPrice: {
            currency: "EUR",
            value: "10.00"
        },
        totalAmount: {
            currency: "EUR",
            value: "10.00"
        },
        vatRate: "00.00",
        vatAmount: {
            currency: "EUR",
            value: "0.00"
        }
    }]
}
```

## Creating commercetools actions from Mollie's response

When an order is successfully created on Mollie, we update commercetools payment with following actions

| Action name (CT)                 | Value                                                           |
| -------------------------------- | --------------------------------------------------------------- |
| `setCustomField`                 | `createOrderResponse: <mollie Order response in string format>` |
| `setCustomField`                 | `mollieOrderStatus: "created"`                                  |
| `setKey`                         | `key: <mollie Order ID>`                                        |
| `changeTransactionInteractionId` | `transactionId: <first CT transaction ID> *`                    |
|                                  | `interactionId: <mollie Payment ID>`                            |
| `addInterfaceInteraction`        | `actionType: "createOrder"`                                     |
|                                  | `createdAt: <local ISO time string> **`                         |
|                                  | `request: <createOrderRequest custom field in string format>`   |
|                                  | `response: <mollie Order response in string format>`            |

\* Actions will always use first transaction

\*\* Timestamp for the time being is local of your deployment
