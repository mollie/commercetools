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

export const orderCreatedWithIdeal = {};

export const orderCreatedWithTwoLineItemsUsingKlarna = {
  resource: 'order',
  id: 'ord_9993p2',
  profileId: 'pfl_a2jBK6dR32',
  method: 'klarnapaylater',
  amount: {
    value: '100.00',
    currency: 'EUR',
  },
  status: 'created',
  isCancelable: true,
  metadata: null,
  createdAt: '2021-12-15T10:37:38+00:00',
  expiresAt: '2022-01-12T10:37:38+00:00',
  mode: 'test',
  locale: 'en_US',
  billingAddress: {
    streetAndNumber: 'Straat 101',
    postalCode: '1456PR',
    city: 'Amsterdam',
    country: 'NL',
    givenName: 'Obélix',
    familyName: 'Gaul',
    email: 'obelix@gaul.com',
  },
  shopperCountryMustMatchBillingCountry: false,
  orderNumber: '3e5b7f3d-8308-4b16-9f77-43f0e2b68963',
  redirectUrl: 'https://www.google.com',
  webhookUrl: 'https://europe-west1-profound-yew-326712.cloudfunctions.net/lb-maurice',
  lines: [
    {
      resource: 'orderline',
      id: 'odl_1.e7cpw0',
      orderId: 'ord_9993p2',
      name: 'Chair',
      sku: null,
      type: 'physical',
      status: 'created',
      metadata: null,
      isCancelable: false,
      quantity: 1,
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
        value: '80.00',
        currency: 'EUR',
      },
      vatRate: '0.00',
      vatAmount: {
        value: '0.00',
        currency: 'EUR',
      },
      totalAmount: {
        value: '80.00',
        currency: 'EUR',
      },
      createdAt: '2021-12-15T10:37:38+00:00',
    },
    {
      resource: 'orderline',
      id: 'odl_1.kam742',
      orderId: 'ord_9993p2',
      name: 'Table',
      sku: null,
      type: 'physical',
      status: 'created',
      metadata: null,
      isCancelable: false,
      quantity: 1,
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
        value: '20.00',
        currency: 'EUR',
      },
      vatRate: '0.00',
      vatAmount: {
        value: '0.00',
        currency: 'EUR',
      },
      totalAmount: {
        value: '20.00',
        currency: 'EUR',
      },
      createdAt: '2021-12-15T10:37:38+00:00',
    },
  ],
  _embedded: {
    payments: [
      {
        resource: 'payment',
        id: 'tr_6khjfnzBTu',
        mode: 'test',
        createdAt: '2021-12-15T10:37:38+00:00',
        amount: {
          value: '100.00',
          currency: 'EUR',
        },
        description: 'Order 3e5b7f3d-8308-4b16-9f77-43f0e2b68963',
        method: 'klarnapaylater',
        metadata: null,
        status: 'open',
        isCancelable: false,
        expiresAt: '2021-12-17T10:37:38+00:00',
        amountCaptured: {
          value: '0.00',
          currency: 'EUR',
        },
        locale: 'en_US',
        profileId: 'pfl_a2jBK6dR32',
        orderId: 'ord_9993p2',
        sequenceType: 'oneoff',
        redirectUrl: 'https://www.google.com',
        webhookUrl: 'https://europe-west1-profound-yew-326712.cloudfunctions.net/lb-maurice',
        settlementAmount: {
          value: '100.00',
          currency: 'EUR',
        },
        _links: {
          self: {
            href: 'https://api.mollie.com/v2/payments/tr_6khjfnzBTu',
            type: 'application/hal+json',
          },
          checkout: {
            href: 'https://www.mollie.com/checkout/test-mode?method=klarnapaylater&token=3.t9bqzc',
            type: 'text/html',
          },
          dashboard: {
            href: 'https://www.mollie.com/dashboard/org_12908718/payments/tr_6khjfnzBTu',
            type: 'text/html',
          },
          order: {
            href: 'https://api.mollie.com/v2/orders/ord_9993p2',
            type: 'application/hal+json',
          },
        },
      },
    ],
  },
  _links: {
    self: {
      href: 'https://api.mollie.com/v2/orders/ord_9993p2?embed=payments',
      type: 'application/hal+json',
    },
    dashboard: {
      href: 'https://www.mollie.com/dashboard/org_12908718/orders/ord_9993p2',
      type: 'text/html',
    },
    checkout: {
      href: 'https://www.mollie.com/checkout/order/9993p2',
      type: 'text/html',
    },
    documentation: {
      href: 'https://docs.mollie.com/reference/v2/orders-api/create-order',
      type: 'text/html',
    },
  },
};
