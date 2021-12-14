export const mockPaymentResponse = {
  resource: 'payment',
  id: 'tr_WDqYK6vllg',
  mode: 'test',
  createdAt: '2018-03-20T13:13:37+00:00',
  amount: {
    value: '10.00',
    currency: 'EUR',
  },
  description: 'Order #12345',
  method: null,
  metadata: {
    order_id: '12345',
  },
  status: 'open',
  isCancelable: false,
  locale: 'nl_NL',
  restrictPaymentMethodsToCountry: 'NL',
  expiresAt: '2018-03-20T13:28:37+00:00',
  details: null,
  profileId: 'pfl_QkEhN94Ba',
  orderId: 'ord_12345',
  sequenceType: 'oneoff',
  redirectUrl: 'https://webshop.example.org/order/12345/',
  webhookUrl: 'https://webshop.example.org/payments/webhook/',
  _links: {
    self: {
      href: 'https://api.mollie.com/v2/payments/tr_WDqYK6vllg',
      type: 'application/hal+json',
    },
    checkout: {
      href: 'https://www.mollie.com/payscreen/select-method/WDqYK6vllg',
      type: 'text/html',
    },
    dashboard: {
      href: 'https://www.mollie.com/dashboard/org_12345678/payments/tr_WDqYK6vllg',
      type: 'application/json',
    },
    documentation: {
      href: 'https://docs.mollie.com/reference/v2/payments-api/get-payment',
      type: 'text/html',
    },
  },
};
