# Creating an Order on Mollie

  * [Overview](#overview)
  * [Parameters map](#parameters-map)
  * [Line Items object](#line-items-object)
  * [Custom Line Items object](#custom-line-items-object)
  * [Shipping Info object](#shipping-info-object)
  * [Billing / Shipping Address object](#billing---shipping-address-object)
  * [Representation: CT Cart](#representation--ct-cart)
  * [Representation: CT Payment](#representation--ct-payment)
  * [Representation: Mollie Order Parameters](#representation--mollie-order-parameters)
  * [Creating commercetools actions from Mollie's response](#creating-commercetools-actions-from-mollie-s-response)

## Overview

To create an order on Mollie, we get required parameters from the commercetools Cart and Payment. Payment must be added to a cart on commercetools before adding the initial transaction. Additionally, some parameters can be passed on the Payment's custom field `createPayment`. Below are some conversion tables, as well as JSON representations of the calls being mapped from commercetools to Mollie.

## Parameters map

| Parameter (CT Payment)                                                     | Parameter (Mollie Order)                     | Required |
|----------------------------------------------------------------------------|----------------------------------------------|----------|
| `amountPlanned: { currencyCode: "EUR", centAmount: 200 }`                  | `amount: { currency: "EUR", value: "2.00" }` | YES      |
| `id: "09f525b2-b739-4167"`                                                 | `orderNumber: "09f525b2-b739-4167"`          | YES      |
| `custom.fields.createPayment.expiresAt: "2018-12-30"`                      | `expiresAt: "2018-12-30"`                    | NO       |
| `custom.fields.createPayment.locale: "nl_NL"` *                            | `locale: nl_NL`                              | NO       |
| `custom.fields.createPayment.webhookUrl: "https://www.webhook.com"` *      | `webhookUrl: "https://www.webhook.com"`      | NO       |
| `custom.fields.createPayment.redirectUrl: "https://www.redirectUrl.com"` * | `redirectUrl: "https://www.redirectUrl.com"` | NO       |
| `paymentMethodInfo.method: "ideal"` **                                     | `method: ideal`                              | YES      |
| `paymentMethodInfo.interface: "mollie"` **                                 |                                              | YES      |
|                                                                            |                                              |          |
| Parameter (CT Cart)                                                        |                                              |          |
| `lineItems: [array]`                                                       | `lines: [array of mollieLines]`              | NO       |
| `customLineItems: [array]`                                                 | `lines: [array of mollieLines]`              | NO       |
| `shippingInfo: [shippingInfo]` ***                                         | `lines: [mollieLine type shipping_fee]`      | NO       |
| `billingAddress: [billingAddress]`                                         | `billingAddress: [billingAddress]`           | YES      |
| `shippingAddress: [shippingAddress]`                                       | `shippingAddress: [shippingAddress]`         | YES      |
| `id: "09f525b2-b739-4168"`                                                 | `metadata: {cartId: "09f525b2-b739-4168"}`   | YES      |

\* This field can be set in config as well, putting it on createPayment will override config value. Locale should be one of the valid "locale" tags that mollie supports. The list is available on mollie's documentation under [locale](https://docs.mollie.com/reference/v2/orders-api/create-order). 
This field is used to extract the `LineItem` and `CustomLineItem` name. The API extension will try to use the localized string that is closest to locale, if this value is set in config.

\** The `PaymentMethodInfo.method` accepts a single [mollie payment method](https://docs.mollie.com/reference/v2/orders-api/create-order). If not provided, you will receive an error. `PaymentMethodInfo.interface` is checked on every request and must be set to `mollie`.

\*** If charging shipping fees, this information must be on the Cart object **before** triggering creating a Payment.

## Line Items object

| Parameter (CT Cart Line Item)                                              | Parameter (Mollie)                                                        | Required |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------- |
| `variant: { en: "Green Apple" }`                                           | `name: "Green Apple"`                                                     | YES      |
| `quantity: 1`                                                              | `quantity: 1`                                                             | YES      |
| `sku: "SKU12345"`                                                          | `sku: "SKU12345"`                                                         | NO       |
| `price: { value: { currencyCode: "EUR", centAmount: 1000 } }`              | `unitPrice: { currency: "EUR", value: "10.00" } `                         | YES      |
| `taxRate: { amount: 0.21 }`                                                | `vatRate: "21.00"`                                                        | YES      |
| `taxedPrice: { totalGross } - { totalNet }` *                              | `vatAmount: { currency: "EUR", value: "2.82" }`                           | YES      |
| `totalprice: { currencyCode: "EUR", centAmount: 1000 }`                    | `totalAmount: { currency: "EUR", value: "10.00" } `                       | YES      |
| `price: { value } x quantity - totalPrice` **                              | `discountAmount: { currency: "EUR", value: "10.00" }`                     | NO       |
| `id: "09f525b2-b739-4169"`                                                 | `metadata: { cartLineItemId: "09f525b2-b739-4169" }`                      | NO       |

\* vatAmount is calculated by using `totalGross - totalNet`
\** discountAmount is calculated only if there is `price.discounted.value` or `discountedPrice.value` present on line item. Calculation is using `line.price.value.centAmount * line.quantity - line.totalPrice.centAmount`

## Custom Line Items object

| Parameter (CT Cart Line Item)                                              | Parameter (Mollie)                                                        | Required |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------- |
| `name: { en: "Green Apple" }`                                              | `name: "Green Apple"`                                                     | YES      |
| `quantity: 1`                                                              | `quantity: 1`                                                             | YES      |
| `money: { currencyCode: "EUR", centAmount: 1000 }`                         | `unitPrice: { currency: "EUR", value: "10.00" } `                         | YES      |
| `taxRate: { amount: 0.21 }`                                                | `vatRate: "21.00"`                                                        | YES      |
| `taxedPrice: { totalGross } - { totalNet }` *                              | `vatAmount: { currency: "EUR", value: "2.82" }`                           | YES      |
| `totalprice: { currencyCode: "EUR", centAmount: 1000 }`                    | `totalAmount: { currency: "EUR", value: "10.00" } `                       | YES      |
| `money x quantity - totalPrice` **                                         | `discountAmount: { currency: "EUR", value: "10.00" }`                     | NO       |
| `id: "09f525b2-b739-4169"`                                                 | `metadata: { cartCustomLineItemId: "09f525b2-b739-4169" }`                | NO       |

\* vatAmount is calculated by using `totalGross - totalNet`
\** discountAmount is calculated only if there is `discountedPrice.value` present on custom line item. Calculation is using `customLine.money.centAmount * customLine.quantity - customLine.totalPrice.centAmount`

## Shipping Info object

| Parameter (CT Cart Shipping Info)                                          | Parameter (Mollie)                                                        | Required |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------- |
| `shippingMethodName: "Standard EU"`                                        | `name: "Shipping - Standard EU"`                                          | YES      |
|                                                                            | `quantity: 1`                                                             | YES      |
| `price: { currencyCode: "EUR", centAmount: 1000 }`                         | `unitPrice: { currency: "EUR", value: "10.00" }`                          | YES      |
| `taxedPrice : {totalGross: { currencyCode: "EUR", centAmount: 1000 }}`     | `totalAmount: { currency: "EUR", value: "10.00" }`                        | YES      |
| `taxRate: { amount: 0.21 }`                                                | `vatRate: "21.00"`                                                        | YES      |
| `taxedPrice: { totalGross } - { totalNet }` *                              | `vatAmount: { currency: "EUR", value: "2.82" }`                           | YES      |
| `price - discountedPrice: { value }` **                                    | `discountAmount: { currency: "EUR", value: "10.00" } `                    | NO       |
|                                                                            | `type: "shipping_fee"`                                                    | NO       |

\* vatAmount is calculated by using `totalGross - totalNet`
\** discountAmount is calculated only if there is `discountedPrice` present on shipping info. Calculation is using `shipping.price.centAmount - shipping.discountedPrice.value.centAmount`


## Billing / Shipping Address object

Mollie only requires billing address to create the order. However, we require shipping address as commercetools does not calculate the tax price for each line item without the shipping address being set.

| Parameter (CT Cart billingAddress/shippingAddress) | Parameter (Mollie)                            | Required |
| -------------------------------------------------- | --------------------------------------------- | -------- |
| `firstName: "Piet"`                                | `givenName: "Piet"`                           | YES      |
| `lastName: "Mondriaan"`                            | `familyName: "Mondriaan"`                     | YES      |
| `email: "coloured_square_lover@basicart.com"`      | `email: "coloured_square_lover@basicart.com"` | YES      |
| `streetName: "Keizersgracht"`                      | `streetAndNumber: "Keizersgracht 126"`        | YES      |
| `streetNumber: "126"`                              |                                               | YES      |
| `postalCode: "1234AB"`                             | `postalCode: "1234AB"`                        | YES      |
| `country: "NL"`                                    | `country: "NL"`                               | YES      |
| `city: "Amsterdam"`                                | `city: "Amsterdam"`                           | YES      |

<br />

## Representation: CT Cart
<details>
  <summary>Cart example</summary>

```json
{
    "type": "Cart",
    "id": "53a1652a-eba2-4854-a6f8-24f100f8e505",
    "version": 5,
    "lastMessageSequenceNumber": 1,
    "createdAt": "2021-12-16T08:19:12.591Z",
    "lastModifiedAt": "2021-12-16T08:21:09.902Z",
    "lastModifiedBy": {
        "clientId": "A-7gCPuzUQnNSdDwlOCC",
        "isPlatformClient": false
    },
    "createdBy": {
        "clientId": "A-7gCPuzUQnNSdDwlOCC",
        "isPlatformClient": false
    },
    "lineItems": [
        {
            "id": "88030bb9-fc13-4b88-8711-0b7fd3e4eb4a",
            "productId": "6fd97a79-c9f4-490e-9eb7-1b502812b266",
            "productKey": "banana",
            "name": {
                "en-US": "Banana"
            },
            "productType": {
                "typeId": "product-type",
                "id": "9d4b0ab5-fde6-4e7c-89ea-d4befcd547e8",
                "version": 1
            },
            "productSlug": {
                "en-US": "banana"
            },
            "variant": {
                "id": 1,
                "sku": "12345",
                "key": "banana-yellow",
                "prices": [
                    {
                        "value": {
                            "type": "centPrecision",
                            "currencyCode": "EUR",
                            "centAmount": 200,
                            "fractionDigits": 2
                        },
                        "id": "9af7209c-c43d-4898-9d3d-96e9ba0a1787",
                        "discounted": {
                            "value": {
                                "type": "centPrecision",
                                "currencyCode": "EUR",
                                "centAmount": 100,
                                "fractionDigits": 2
                            },
                            "discount": {
                                "typeId": "product-discount",
                                "id": "272062e5-1329-4983-98bf-ca8b9282aa2d"
                            }
                        }
                    }
                ],
                "images": [],
                "attributes": [],
                "assets": []
            },
            "price": {
                "value": {
                    "type": "centPrecision",
                    "currencyCode": "EUR",
                    "centAmount": 200,
                    "fractionDigits": 2
                },
                "id": "9af7209c-c43d-4898-9d3d-96e9ba0a1787",
                "discounted": {
                    "value": {
                        "type": "centPrecision",
                        "currencyCode": "EUR",
                        "centAmount": 100,
                        "fractionDigits": 2
                    },
                    "discount": {
                        "typeId": "product-discount",
                        "id": "272062e5-1329-4983-98bf-ca8b9282aa2d"
                    }
                }
            },
            "quantity": 2,
            "discountedPrice": {
                "value": {
                    "type": "centPrecision",
                    "currencyCode": "EUR",
                    "centAmount": 90,
                    "fractionDigits": 2
                },
                "includedDiscounts": [
                    {
                        "discount": {
                            "typeId": "cart-discount",
                            "id": "8f50ace8-480c-49d4-b43f-462336a5fdd0"
                        },
                        "discountedAmount": {
                            "type": "centPrecision",
                            "currencyCode": "EUR",
                            "centAmount": 10,
                            "fractionDigits": 2
                        }
                    }
                ]
            },
            "discountedPricePerQuantity": [
                {
                    "quantity": 2,
                    "discountedPrice": {
                        "value": {
                            "type": "centPrecision",
                            "currencyCode": "EUR",
                            "centAmount": 90,
                            "fractionDigits": 2
                        },
                        "includedDiscounts": [
                            {
                                "discount": {
                                    "typeId": "cart-discount",
                                    "id": "8f50ace8-480c-49d4-b43f-462336a5fdd0"
                                },
                                "discountedAmount": {
                                    "type": "centPrecision",
                                    "currencyCode": "EUR",
                                    "centAmount": 10,
                                    "fractionDigits": 2
                                }
                            }
                        ]
                    }
                }
            ],
            "taxRate": {
                "name": "21% BTW",
                "amount": 0.21,
                "includedInPrice": true,
                "country": "NL",
                "id": "22LLeAS3",
                "subRates": []
            },
            "addedAt": "2021-12-16T08:19:12.582Z",
            "lastModifiedAt": "2021-12-16T08:19:12.582Z",
            "state": [
                {
                    "quantity": 2,
                    "state": {
                        "typeId": "state",
                        "id": "5c0e44e5-c554-4e0c-94f2-47fe0249d1d7"
                    }
                }
            ],
            "priceMode": "Platform",
            "totalPrice": {
                "type": "centPrecision",
                "currencyCode": "EUR",
                "centAmount": 180,
                "fractionDigits": 2
            },
            "taxedPrice": {
                "totalNet": {
                    "type": "centPrecision",
                    "currencyCode": "EUR",
                    "centAmount": 149,
                    "fractionDigits": 2
                },
                "totalGross": {
                    "type": "centPrecision",
                    "currencyCode": "EUR",
                    "centAmount": 180,
                    "fractionDigits": 2
                }
            },
            "lineItemMode": "Standard"
        }
    ],
    "cartState": "Active",
    "totalPrice": {
        "type": "centPrecision",
        "currencyCode": "EUR",
        "centAmount": 180,
        "fractionDigits": 2
    },
    "taxedPrice": {
        "totalNet": {
            "type": "centPrecision",
            "currencyCode": "EUR",
            "centAmount": 149,
            "fractionDigits": 2
        },
        "totalGross": {
            "type": "centPrecision",
            "currencyCode": "EUR",
            "centAmount": 180,
            "fractionDigits": 2
        },
        "taxPortions": [
            {
                "rate": 0.21,
                "amount": {
                    "type": "centPrecision",
                    "currencyCode": "EUR",
                    "centAmount": 31,
                    "fractionDigits": 2
                },
                "name": "21% BTW"
            }
        ]
    },
    "customLineItems": [],
    "discountCodes": [],
    "paymentInfo": {
        "payments": [
            {
                "typeId": "payment",
                "id": "c0887a2d-bfbf-4f77-8f3d-fc33fb4c0920"
            }
        ]
    },
    "inventoryMode": "None",
    "taxMode": "Platform",
    "taxRoundingMode": "HalfEven",
    "taxCalculationMode": "LineItemLevel",
    "deleteDaysAfterLastModification": 90,
    "refusedGifts": [],
    "origin": "Customer",
    "shippingAddress": {
        "firstName": "Piet",
        "lastName": "Mondriaan",
        "streetName": "Keizersgracht",
        "streetNumber": "126",
        "postalCode": "1234AB",
        "city": "Amsterdam",
        "country": "NL",
        "email": "coloured_square_lover@basicart.com"
    },
    "billingAddress": {
        "firstName": "Piet",
        "lastName": "Mondriaan",
        "streetName": "Keizersgracht",
        "streetNumber": "126",
        "postalCode": "1234AB",
        "city": "Amsterdam",
        "country": "NL",
        "email": "coloured_square_lover@basicart.com"
    },
    "itemShippingAddresses": []
}
```
</details>
<br />

## Representation: CT Payment
<details>
  <summary>Payment example</summary>

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
        "centAmount": 180,
        "fractionDigits": 2
    },
    "paymentMethodInfo": {
        "paymentInterface": "Mollie",
        "method": "ideal"
    },
    "custom": {
        "type": {
            "typeId": "type",
            "id": "c11764fa-4e07-4cc0-ba40-e7dfc8d67b4e"
        },
        "fields": {
            "createPayment": "{\"redirectUrl\":\"https://www.redirect.com/\",\"webhookUrl\":\"https://webhook.com\",\"locale\":\"nl_NL\"}"
        }
    },
    "paymentStatus": {},
    "transactions": [
        {
            "id": "79b2a578-c8a4-4450-98b9-df2f55871a9e",
            "type": "Charge",
            "amount": {
                "type": "centPrecision",
                "currencyCode": "EUR",
                "centAmount": 180,
                "fractionDigits": 2
            },
            "interactionId": "tr_SDSQMRH8kH",
            "state": "Pending"
        }
    ],
    "interfaceInteractions": []
}
```
</details>
<br />

## Representation: Mollie Order Parameters
<details>
  <summary>Order parameters example</summary>

```json
{
  "amount": { "value": "1.80", "currency": "EUR" },
  "orderNumber": "c0887a2d-bfbf-4f77-8f3d-fc33fb4c0920",
  "lines": [
  {
    "name": "Banana",
    "quantity": 2,
    "sku": "12345",
    "unitPrice": { "value": "2.00", "currency": "EUR" },
    "vatRate": "21.00",
    "totalAmount": { "value": "1.80", "currency": "EUR" },
    "vatAmount": { "value": "0.31", "currency": "EUR" },
    "metadata": { "cartLineItemId": "88030bb9-fc13-4b88-8711-0b7fd3e4eb4a" },
    "discountAmount": { "value": "2.20", "currency": "EUR" }
  }
],
  "locale": "nl_NL",
  "billingAddress": {
    "givenName": "Piet",
    "familyName": "Mondriaan",
    "email": "coloured_square_lover@basicart.com",
    "streetAndNumber": "Keizersgracht 126",
    "city": "Amsterdam",
    "postalCode": "1234AB",
    "country": "NL"
  },
  "method": "ideal",
  "webhookUrl": "https://www.webhook.com",
  "embed": [ "payments" ],
  "payment": {
    "webhookUrl": "https://www.webhook.com"
  },
  "redirectUrl": "https://www.redirect.com",
  "expiresAt": "",
  "metadata": { "cartId": "53a1652a-eba2-4854-a6f8-24f100f8e505" },
  "shippingAddress": {
    "givenName": "Piet",
    "familyName": "Mondriaan",
    "email": "coloured_square_lover@basicart.com",
    "streetAndNumber": "Keizersgracht 126",
    "city": "Amsterdam",
    "postalCode": "1234AB",
    "country": "NL"
  }
}
```
</details>
<br />

## Creating commercetools actions from Mollie's response

When an order is successfully created on Mollie, we update commercetools payment with following actions

| Action name (CT)                 | Value                                                                      |
| -------------------------------- | -------------------------------------------------------------------------- |
| `setKey`                         | `key: <mollie Order ID>`                                                   |
| `setMethodInfoName`              | `interfaceText: "created"`                                                 |
| `changeTransactionState`         | `createOrderResponse: <transactionId>, state: 'Pending'`                   |
| `changeTransactionTimestamp`     | `createOrderResponse: <createdAt>`                                         |
| `changeTransactionInteractionId` | `transactionId: <first CT transaction ID>` *                               |
|                                  | `interactionId: <mollie Payment ID>`                                       |
| `addInterfaceInteraction`        | `actionType: "createOrder"`                                                |
|                                  | `id: <UUID>`                                                               |
|                                  | `createdAt: <local ISO time string>`  **                                   |
|                                  | `request: {<createPayment custom field in string format, transactionId>`   |
|                                  | `response: <mollieOrderId, checkoutUrl, transactionId>`                    |

\* Actions will always use first transaction

\** Timestamp for the time being is local of your deployment
