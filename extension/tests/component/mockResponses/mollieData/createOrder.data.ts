// 4xx
export const totalAmountDoesNotMatchOrderLines = {
  status: 422,
  title: 'Unprocessable Entity',
  detail: 'The amount of the order does not match the total amount from the order lines. Expected order amount to be €100.00 but got €10.00',
  field: 'amount',
  _links: {
    documentation: {
      href: 'https://docs.mollie.com/overview/handling-errors',
      type: 'text/html',
    },
  },
};

export const paymentMethodNotEnabledInProfile = {
  status: 422,
  title: 'Unprocessable Entity',
  detail: 'The payment method is not enabled in your website profile',
  field: 'payment.method',
  _links: {
    documentation: {
      href: 'https://docs.mollie.com/reference/v2/orders-api/create-order',
      type: 'text/html',
    },
  },
};

export const givenNameTooLong = {
  statusCode: 400,
  message: "The 'givenName' field should not be longer than 100 characters",
  errors: [
    {
      code: 'SemanticError',
      message: "The 'givenName' field should not be longer than 100 characters",
      errorByExtension: {
        id: '01cf86a6-b880-40ee-9e26-81e3383a8e54',
        key: 'julien-extension-1',
      },
      extensionExtraInfo: {
        originalStatusCode: 422,
        links: {
          documentation: {
            href: 'https://docs.mollie.com/overview/handling-errors',
            type: 'text/html',
          },
        },
        title: 'Unprocessable Entity',
        field: 'shippingAddress.givenName',
      },
    },
  ],
};

// 201
export const amountLowerThanMinimumKlarnaSliceIt = {
  status: 422,
  title: 'Unprocessable Entity',
  detail: 'The amount is lower than the minimum',
  field: 'payment.amount',
  _links: {
    documentation: {
      href: 'https://docs.mollie.com/reference/v2/orders-api/create-order',
      type: 'text/html',
    },
  },
};

export const orderCreatedWithTwoLineItemsUsingKlarna = {
  resource: 'order',
  id: 'ord_l2idwq',
  profileId: 'pfl_a2jBK6dR32',
  method: 'klarnapaylater',
  amount: {
    value: '900.00',
    currency: 'EUR',
  },
  status: 'created',
  isCancelable: true,
  metadata: {
    cartId: '08f21547-92c8-4519-9fd8-84dc05827f0f',
  },
  createdAt: '2021-12-20T11:17:23+00:00',
  expiresAt: '2022-01-17T11:17:23+00:00',
  mode: 'test',
  locale: 'nl_NL',
  billingAddress: {
    streetAndNumber: 'Picassostraat 4711',
    postalCode: '1111AB',
    city: 'Amsterdam',
    country: 'NL',
    givenName: 'Pablo',
    familyName: 'Picasso',
    email: 'picasso@mail.com',
  },
  shopperCountryMustMatchBillingCountry: false,
  orderNumber: 'b4ebaa5e-3ebc-4acf-81bf-230c328401d5',
  shippingAddress: {
    streetAndNumber: 'Picassostraat 4711',
    postalCode: '1111AB',
    city: 'Amsterdam',
    country: 'NL',
    givenName: 'Diego',
    familyName: 'Ruiz y Picasso',
    email: 'picasso@mail.com',
  },
  redirectUrl: 'https://www.google.com/',
  webhookUrl: 'https://europe-west1-profound-yew-326712.cloudfunctions.net/lb-maurice',
  lines: [
    {
      resource: 'orderline',
      id: 'odl_1.q46hg4',
      orderId: 'ord_l2idwq',
      name: 'Sweater Pinko white',
      sku: 'M0E20000000DJR9',
      type: 'physical',
      status: 'created',
      metadata: {
        cartLineItemId: '23a9f668-68c8-4f86-bbeb-e81364232ba2',
      },
      isCancelable: false,
      quantity: 2,
      quantityShipped: 0,
      amountShipped: {
        value: '0.00',
        currency: 'EUR',
      },
      quantityRefunded: 0,
      amountRefunded: {
        value: '0.00',
        currency: 'EUR',
      },
      quantityCanceled: 0,
      amountCanceled: {
        value: '0.00',
        currency: 'EUR',
      },
      shippableQuantity: 0,
      refundableQuantity: 0,
      cancelableQuantity: 0,
      unitPrice: {
        value: '212.50',
        currency: 'EUR',
      },
      vatRate: '21.00',
      vatAmount: {
        value: '73.76',
        currency: 'EUR',
      },
      totalAmount: {
        value: '425.00',
        currency: 'EUR',
      },
      createdAt: '2021-12-20T11:17:23+00:00',
    },
    {
      resource: 'orderline',
      id: 'odl_1.wb6ssm',
      orderId: 'ord_l2idwq',
      name: 'Bag medium GUM black',
      sku: 'A0E2000000027DV',
      type: 'physical',
      status: 'created',
      metadata: {
        cartLineItemId: '48932224-7b98-44fc-ae0c-8f05550f3d7c',
      },
      isCancelable: false,
      quantity: 4,
      quantityShipped: 0,
      amountShipped: {
        value: '0.00',
        currency: 'EUR',
      },
      quantityRefunded: 0,
      amountRefunded: {
        value: '0.00',
        currency: 'EUR',
      },
      quantityCanceled: 0,
      amountCanceled: {
        value: '0.00',
        currency: 'EUR',
      },
      shippableQuantity: 0,
      refundableQuantity: 0,
      cancelableQuantity: 0,
      unitPrice: {
        value: '118.75',
        currency: 'EUR',
      },
      vatRate: '21.00',
      vatAmount: {
        value: '82.44',
        currency: 'EUR',
      },
      totalAmount: {
        value: '475.00',
        currency: 'EUR',
      },
      createdAt: '2021-12-20T11:17:23+00:00',
    },
  ],
  _embedded: {
    payments: [
      {
        resource: 'payment',
        id: 'tr_FCc42uPfJx',
        mode: 'test',
        createdAt: '2021-12-20T11:17:23+00:00',
        amount: {
          value: '900.00',
          currency: 'EUR',
        },
        description: 'Order b4ebaa5e-3ebc-4acf-81bf-230c328401d5',
        method: 'klarnapaylater',
        metadata: null,
        status: 'open',
        isCancelable: false,
        expiresAt: '2021-12-22T11:17:23+00:00',
        amountCaptured: {
          value: '0.00',
          currency: 'EUR',
        },
        locale: 'nl_NL',
        profileId: 'pfl_a2jBK6dR32',
        orderId: 'ord_l2idwq',
        sequenceType: 'oneoff',
        redirectUrl: 'https://www.google.com/',
        webhookUrl: 'https://europe-west1-profound-yew-326712.cloudfunctions.net/lb-maurice',
        settlementAmount: {
          value: '900.00',
          currency: 'EUR',
        },
        _links: {
          self: {
            href: 'https://api.mollie.com/v2/payments/tr_FCc42uPfJx',
            type: 'application/hal+json',
          },
          checkout: {
            href: 'https://www.mollie.com/checkout/test-mode?method=klarnapaylater&token=3.j521fg',
            type: 'text/html',
          },
          dashboard: {
            href: 'https://www.mollie.com/dashboard/org_12908718/payments/tr_FCc42uPfJx',
            type: 'text/html',
          },
          order: {
            href: 'https://api.mollie.com/v2/orders/ord_l2idwq',
            type: 'application/hal+json',
          },
        },
      },
    ],
    refunds: [],
  },
  _links: {
    self: {
      href: 'https://api.mollie.com/v2/orders/ord_l2idwq?embed=payments%2Crefunds',
      type: 'application/hal+json',
    },
    dashboard: {
      href: 'https://www.mollie.com/dashboard/org_12908718/orders/ord_l2idwq',
      type: 'text/html',
    },
    checkout: {
      href: 'https://www.mollie.com/checkout/order/l2idwq',
      type: 'text/html',
    },
    documentation: {
      href: 'https://docs.mollie.com/reference/v2/orders-api/get-order',
      type: 'text/html',
    },
  },
};

export const orderCreatedWithTwoLinesUsingIdeal = {
  resource: 'order',
  id: 'ord_8xnw8a',
  profileId: 'pfl_a2jBK6dR32',
  method: 'ideal',
  amount: {
    value: '900.00',
    currency: 'EUR',
  },
  status: 'created',
  isCancelable: true,
  metadata: {
    cartId: '08f21547-92c8-4519-9fd8-84dc05827f0f',
  },
  createdAt: '2021-12-20T10:15:15+00:00',
  expiresAt: '2022-01-17T10:15:15+00:00',
  mode: 'test',
  locale: 'nl_NL',
  billingAddress: {
    streetAndNumber: 'Picassostraat 4711',
    postalCode: '1111AB',
    city: 'Amsterdam',
    country: 'NL',
    givenName: 'Pablo',
    familyName: 'Picasso',
    email: 'picasso@mail.com',
  },
  shopperCountryMustMatchBillingCountry: false,
  orderNumber: 'd75d0b1d-64c5-4c8f-86f6-b9510332e743',
  shippingAddress: {
    streetAndNumber: 'Picassostraat 4711',
    postalCode: '1111AB',
    city: 'Amsterdam',
    country: 'NL',
    givenName: 'Diego',
    familyName: 'Ruiz y Picasso',
    email: 'picasso@mail.com',
  },
  redirectUrl: 'https://www.google.com/',
  webhookUrl: 'https://europe-west1-profound-yew-326712.cloudfunctions.net/lb-maurice',
  lines: [
    {
      resource: 'orderline',
      id: 'odl_1.y0kpfo',
      orderId: 'ord_8xnw8a',
      name: 'Sweater Pinko white',
      sku: 'M0E20000000DJR9',
      type: 'physical',
      status: 'created',
      metadata: {
        cartLineItemId: '23a9f668-68c8-4f86-bbeb-e81364232ba2',
      },
      isCancelable: false,
      quantity: 2,
      quantityShipped: 0,
      amountShipped: {
        value: '0.00',
        currency: 'EUR',
      },
      quantityRefunded: 0,
      amountRefunded: {
        value: '0.00',
        currency: 'EUR',
      },
      quantityCanceled: 0,
      amountCanceled: {
        value: '0.00',
        currency: 'EUR',
      },
      shippableQuantity: 0,
      refundableQuantity: 0,
      cancelableQuantity: 0,
      unitPrice: {
        value: '212.50',
        currency: 'EUR',
      },
      vatRate: '21.00',
      vatAmount: {
        value: '73.76',
        currency: 'EUR',
      },
      totalAmount: {
        value: '425.00',
        currency: 'EUR',
      },
      createdAt: '2021-12-20T10:15:15+00:00',
    },
    {
      resource: 'orderline',
      id: 'odl_1.4labw6',
      orderId: 'ord_8xnw8a',
      name: 'Bag medium GUM black',
      sku: 'A0E2000000027DV',
      type: 'physical',
      status: 'created',
      metadata: {
        cartLineItemId: '48932224-7b98-44fc-ae0c-8f05550f3d7c',
      },
      isCancelable: false,
      quantity: 4,
      quantityShipped: 0,
      amountShipped: {
        value: '0.00',
        currency: 'EUR',
      },
      quantityRefunded: 0,
      amountRefunded: {
        value: '0.00',
        currency: 'EUR',
      },
      quantityCanceled: 0,
      amountCanceled: {
        value: '0.00',
        currency: 'EUR',
      },
      shippableQuantity: 0,
      refundableQuantity: 0,
      cancelableQuantity: 0,
      unitPrice: {
        value: '118.75',
        currency: 'EUR',
      },
      vatRate: '21.00',
      vatAmount: {
        value: '82.44',
        currency: 'EUR',
      },
      totalAmount: {
        value: '475.00',
        currency: 'EUR',
      },
      createdAt: '2021-12-20T10:15:15+00:00',
    },
  ],
  _embedded: {
    payments: [
      {
        resource: 'payment',
        id: 'tr_J5R48EP58J',
        mode: 'test',
        createdAt: '2021-12-20T10:15:15+00:00',
        amount: {
          value: '900.00',
          currency: 'EUR',
        },
        description: 'Order d75d0b1d-64c5-4c8f-86f6-b9510332e743',
        method: 'ideal',
        metadata: null,
        status: 'open',
        isCancelable: false,
        expiresAt: '2021-12-20T10:30:15+00:00',
        locale: 'nl_NL',
        profileId: 'pfl_a2jBK6dR32',
        orderId: 'ord_8xnw8a',
        sequenceType: 'oneoff',
        redirectUrl: 'https://www.google.com/',
        webhookUrl: 'https://europe-west1-profound-yew-326712.cloudfunctions.net/lb-maurice',
        _links: {
          self: {
            href: 'https://api.mollie.com/v2/payments/tr_J5R48EP58J',
            type: 'application/hal+json',
          },
          checkout: {
            href: 'https://www.mollie.com/checkout/select-issuer/ideal/J5R48EP58J',
            type: 'text/html',
          },
          dashboard: {
            href: 'https://www.mollie.com/dashboard/org_12908718/payments/tr_J5R48EP58J',
            type: 'text/html',
          },
          order: {
            href: 'https://api.mollie.com/v2/orders/ord_8xnw8a',
            type: 'application/hal+json',
          },
        },
      },
    ],
    refunds: [],
  },
  _links: {
    self: {
      href: 'https://api.mollie.com/v2/orders/ord_8xnw8a?embed=payments%2Crefunds',
      type: 'application/hal+json',
    },
    dashboard: {
      href: 'https://www.mollie.com/dashboard/org_12908718/orders/ord_8xnw8a',
      type: 'text/html',
    },
    checkout: {
      href: 'https://www.mollie.com/checkout/order/8xnw8a',
      type: 'text/html',
    },
    documentation: {
      href: 'https://docs.mollie.com/reference/v2/orders-api/get-order',
      type: 'text/html',
    },
  },
};

export const orderCreatedWithTwoLinesUsingKlarna = {};
