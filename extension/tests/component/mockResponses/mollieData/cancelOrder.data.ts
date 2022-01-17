export const orderCanceled = {
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
