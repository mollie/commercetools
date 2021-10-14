## Creating an Order on Mollie

To create an order on Mollie, we need to have a minimum number of parameters on Commercetools. These will get converted on Mollie. Below are some conversion tables, as well as JSON representations of the calls being mapped from CT -> Mollie.

# createPaymentRequest object (req.body.resource.obj.custom.fields.createPaymentRequest)

| Parameter (CT)                                      | Parameter (Mollie)                               |
| --------------------------------------------------- | ------------------------------------------------ |
| `orderNumber: 10920`                                | `orderNumber: 10920 `                            |
| `orderWebhookUrl: "https://www.examplewebhook.com"` | `webhookUrl: "https://www.examplewebhook.com"`   |
| `redirectUrl: "https://www.exampleredirect.com"`    | `redirectUrl: "https://www.exampleredirect.com"` |
| `locale: nl_NL`                                     | `locale: nl_NL`                                  |
| `shopperCountryMustMatchBillingCountry: false`      | `shopperCountryMustMatchBillingCountry: false`   |
| `expiresAt: "2021-12-25"`                           | `expiresAt: '2021-12-25'`                        |
| `billingAddress: [billingAddress]`                  | `billingAddress: [billingAddress]`               |
| `lines: [array of lines]`                           | `lines: [array of lines]`                        |

# lines object (inside createPaymentRequest object)

| Parameter (CT)                                                       | Parameter (Mollie)                                  |
| -------------------------------------------------------------------- | --------------------------------------------------- |
| `name: { en: "apple" }`                                              | `name: apple `                                      |
| `quantity: 1`                                                        | `quantity: 1 `                                      |
| `price: { value: { currencyCode: "EUR", centAmount: "1000" } }`      | `unitPrice: { currency: "EUR", value: "10.00" } `   |
| `totalPrice: { value: { currencyCode: "EUR", centAmount: "1000" } }` | `totalAmount: { currency: "EUR", value: "10.00" } ` |

# billingAddress object (inside createPaymentRequest object)

| Parameter (CT)                                | Parameter (Mollie)                            |
| --------------------------------------------- | --------------------------------------------- |
| `firstName: "Piet"`                           | `givenName: "Piet" `                          |
| `lastName: "Mondriaan"`                       | `familyName: "Mondriaan" `                    |
| `email: "coloured_square_lover@basicart.com"` | `email: "coloured_square_lover@basicart.com"` |
| `streetName: "Keizersgracht"`                 | `streetAndNumber: "Keizersgracht 126" `       |
| `streetNumber: "126"`                         |                                               |
| `postalCode: "1234AB"`                        | `postalCode: "1234AB"`                        |
| `country: "NL"`                               | `country: "NL" `                              |
| `city: "Amsterdam"`                           | `city: "Amsterdam"`                           |

# amoundPlanned object (req.body.resource.obj.amountPlanned)

| Parameter (CT)     | Parameter (Mollie) |
| ------------------ | ------------------ |
| `centAmount: 1000` | `value: "10.00"`   |
| `currency: "EUR"`  | `currency: "EUR"`  |

# paymentMethodInfo object (req.body.resource.obj.paymentMethodInfo)

| Parameter (CT)          | Parameter (Mollie)     |
| ----------------------- | ---------------------- |
| `method: "CREDIT_CARD"` | `method: "creditcard"` |

# Representation: CT create payment

```
{
    custom: {
        fields: {
                createOrderRequest: "{\"orderNumber\":\"1001\",\"orderWebhookUrl\":\"https:\/\/www.examplewebhook.com\/\",\"locale\":\"nl_NL\",\"redirectUrl\":\"https:\/\/www.exampleredirect.com\/\",\"lines\":[{\"id\":\"18920\",\"productId\":\"900220\",\"name\":{\"en\":\"apple\"},\"variant\":{\"id\":\"294028\"},\"price\":{\"id\":\"lineItemPriceId\",\"value\":{\"currencyCode\":\"EUR\",\"centAmount\":1000}},\"totalPrice\":{\"currencyCode\":\"EUR\",\"centAmount\":1000},\"quantity\":1,\"taxRate\":\"00.00\",\"shopperCountryMustMatchBillingCountry\":true,\"state\":[{\"quantity\":1,\"state\":{\"typeId\":\"state\",\"id\":\"stateOfApple\"}}]}]}"
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