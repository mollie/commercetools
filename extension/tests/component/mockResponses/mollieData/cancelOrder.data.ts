export const wholeOrderCanceled = {
  resource: 'order',
  id: 'ord_8wmqcHMN4U',
  profileId: 'pfl_URR55HPMGx',
  amount: {
    value: '1027.99',
    currency: 'EUR',
  },
  status: 'canceled',
  isCancelable: false,
  metadata: null,
  createdAt: '2018-08-02T09:29:56+00:00',
  mode: 'live',
  locale: 'nl_NL',
  billingAddress: {
    organizationName: 'Mollie B.V.',
    streetAndNumber: 'Keizersgracht 126',
    postalCode: '1015 CW',
    city: 'Amsterdam',
    country: 'nl',
    givenName: 'Luke',
    familyName: 'Skywalker',
    email: 'luke@skywalker.com',
  },
  orderNumber: '18475',
  shippingAddress: {
    organizationName: 'Mollie B.V.',
    streetAndNumber: 'Keizersgracht 126',
    postalCode: '1015 CW',
    city: 'Amsterdam',
    country: 'nl',
    givenName: 'Luke',
    familyName: 'Skywalker',
    email: 'luke@skywalker.com',
  },
  canceledAt: '2018-08-03T09:29:56+00:00',
  redirectUrl: 'https://example.org/redirect',
  lines: [],
};

export const cancelOrderError = {
  status: 400,
  title: 'Bad Request',
  detail: 'The order cannot be canceled from state: completed',
  _links: {
    documentation: {
      href: 'https://docs.mollie.com/overview/handling-errors',
      type: 'text/html',
    },
  },
};

export const mockAuthorizedOrder = {
  resource: 'order',
  id: 'ord_123456',
  profileId: 'pfl_VtWA783A63',
  method: 'klarnapaylater',
  amount: {
    value: '6.74',
    currency: 'EUR',
  },
  status: 'authorized',
  isCancelable: true,
  metadata: {
    cartId: 'b8e0abbc-9afe-4ce0-98cd-e4cf82eaf7aa',
  },
  createdAt: '2021-01-20T09:14:16+00:00',
  expiresAt: '2021-02-17T09:14:16+00:00',
  mode: 'test',
  locale: 'nl_NL',
  billingAddress: {
    streetAndNumber: 'Keizersgracht 126',
    postalCode: '1234AB',
    city: 'Amsterdam',
    country: 'NL',
    givenName: 'Piet',
    familyName: 'Mondriaan',
    email: 'coloured_square_lover@basicart.com',
  },
  shopperCountryMustMatchBillingCountry: false,
  orderNumber: '8add76d6-6b09-4fa0-af10-db2f7ee387cc',
  shippingAddress: {
    streetAndNumber: 'Keizersgracht 126',
    postalCode: '1234AB',
    city: 'Amsterdam',
    country: 'NL',
    givenName: 'Piet',
    familyName: 'Mondriaan',
    email: 'coloured_square_lover@basicart.com',
  },
  authorizedAt: '2021-01-20T09:14:52+00:00',
  redirectUrl: 'https://www.redirect.url/',
  webhookUrl: 'https://www.webhook.url',
  lines: [
    {
      resource: 'orderline',
      id: 'odl_1.pdue8w',
      orderId: 'ord_123456',
      name: 'Apple',
      sku: '21345',
      type: 'physical',
      status: 'authorized',
      metadata: {
        cartLineItemId: 'd102ef48-89dd-428c-bad5-edbe2ef0bbca',
      },
      isCancelable: true,
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
      shippableQuantity: 4,
      refundableQuantity: 0,
      cancelableQuantity: 4,
      unitPrice: {
        value: '2.50',
        currency: 'EUR',
      },
      vatRate: '21.00',
      vatAmount: {
        value: '1.17',
        currency: 'EUR',
      },
      totalAmount: {
        value: '6.74',
        currency: 'EUR',
      },
      createdAt: '2021-01-20T09:14:16+00:00',
      discountAmount: {
        value: '3.26',
        currency: 'EUR',
      },
    },
    {
      resource: 'orderline',
      id: 'odl_1.vfuxoy',
      orderId: 'ord_123456',
      name: 'Shipping - Standard Shipping',
      sku: null,
      type: 'shipping_fee',
      status: 'authorized',
      metadata: null,
      isCancelable: true,
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
      shippableQuantity: 1,
      refundableQuantity: 0,
      cancelableQuantity: 1,
      unitPrice: {
        value: '40.00',
        currency: 'EUR',
      },
      vatRate: '21.00',
      vatAmount: {
        value: '0.00',
        currency: 'EUR',
      },
      totalAmount: {
        value: '0.00',
        currency: 'EUR',
      },
      createdAt: '2021-01-20T09:14:16+00:00',
      discountAmount: {
        value: '40.00',
        currency: 'EUR',
      },
    },
  ],
};
