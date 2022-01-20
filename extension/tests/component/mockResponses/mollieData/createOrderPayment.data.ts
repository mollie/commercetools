export const orderPaymentWithKlarna = {
  resource: 'payment',
  id: 'tr_DCNv63fDhy',
  mode: 'test',
  createdAt: '2022-01-17T13:18:53+00:00',
  amount: {
    value: '790.00',
    currency: 'EUR',
  },
  description: 'Order d0c5e8ac-212f-44e3-9fa0-015606441054',
  method: 'klarnapaylater',
  metadata: null,
  status: 'open',
  isCancelable: false,
  expiresAt: '2022-01-19T13:18:53+00:00',
  amountCaptured: {
    value: '0.00',
    currency: 'EUR',
  },
  locale: 'nl_NL',
  profileId: 'pfl_a2jBK6dR32',
  orderId: 'ord_vgk506',
  sequenceType: 'oneoff',
  redirectUrl: 'https://www.mollie.com/',
  webhookUrl: 'https://www.webhook.url',
  settlementAmount: {
    value: '790.00',
    currency: 'EUR',
  },
  _links: {
    self: {
      href: 'https://api.mollie.com/v2/payments/tr_DCNv63fDhy',
      type: 'application/hal+json',
    },
    checkout: {
      href: 'https://www.mollie.com/checkout/test-mode?method=klarnapaylater&token=3.ld7bf8',
      type: 'text/html',
    },
    dashboard: {
      href: 'https://www.mollie.com/dashboard/org_12908718/payments/tr_DCNv63fDhy',
      type: 'text/html',
    },
    order: {
      href: 'https://api.mollie.com/v2/orders/ord_vgk506',
      type: 'application/hal+json',
    },
    documentation: {
      href: 'https://docs.mollie.com/reference/v2/orders-api/create-order-payment',
      type: 'text/html',
    },
  },
};

export const orderPaymentWithIDEAL = {
  resource: 'payment',
  id: 'tr_DCNv63fDhy',
  mode: 'test',
  createdAt: '2022-01-17T13:18:53+00:00',
  amount: {
    value: '790.00',
    currency: 'EUR',
  },
  description: 'Order d0c5e8ac-212f-44e3-9fa0-015606441054',
  method: 'ideal',
  metadata: null,
  status: 'open',
  isCancelable: false,
  expiresAt: '2022-01-19T13:18:53+00:00',
  amountCaptured: {
    value: '0.00',
    currency: 'EUR',
  },
  locale: 'nl_NL',
  profileId: 'pfl_a2jBK6dR32',
  orderId: 'ord_vgk506',
  sequenceType: 'oneoff',
  redirectUrl: 'https://www.mollie.com/',
  webhookUrl: 'https://www.webhook.url',
  settlementAmount: {
    value: '790.00',
    currency: 'EUR',
  },
  _links: {
    self: {
      href: 'https://api.mollie.com/v2/payments/tr_DCNv63fDhy',
      type: 'application/hal+json',
    },
    checkout: {
      href: 'https://www.mollie.com/checkout/test-mode?method=klarnapaylater&token=3.ld7bf8',
      type: 'text/html',
    },
    dashboard: {
      href: 'https://www.mollie.com/dashboard/org_12908718/payments/tr_DCNv63fDhy',
      type: 'text/html',
    },
    order: {
      href: 'https://api.mollie.com/v2/orders/ord_vgk506',
      type: 'application/hal+json',
    },
    documentation: {
      href: 'https://docs.mollie.com/reference/v2/orders-api/create-order-payment',
      type: 'text/html',
    },
  },
};

export const orderHasOpenPaymentError = {
  status: 422,
  title: 'Unprocessable Entity',
  detail: 'Cannot create a new payment for order ord_byxxzq when it has an open payment.',
  _links: {
    documentation: {
      href: 'https://docs.mollie.com/overview/handling-errors',
      type: 'text/html',
    },
  },
};
