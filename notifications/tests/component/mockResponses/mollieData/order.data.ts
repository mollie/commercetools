export const mockOrderResponse = {
  resource: 'order',
  id: 'ord_kEn1PlbGa',
  profileId: 'pfl_URR55HPMGx',
  method: 'ideal',
  amount: {
    value: '1027.99',
    currency: 'EUR',
  },
  status: 'created',
  isCancelable: true,
  metadata: null,
  createdAt: '2018-08-02T09:29:56+00:00',
  expiresAt: '2018-08-30T09:29:56+00:00',
  mode: 'live',
  locale: 'nl_NL',
  shopperCountryMustMatchBillingCountry: false,
  consumerDateOfBirth: '1993-10-21',
  orderNumber: '18475',
  redirectUrl: 'https://example.org/redirect',
  lines: [],
  _embedded: {
    payments: [
      {
        resource: 'payment',
        id: 'tr_ncaPcAhuUV',
        mode: 'live',
        createdAt: '2018-09-07T12:00:05+00:00',
        amount: {
          value: '1027.99',
          currency: 'EUR',
        },
        description: 'Order #1337 (Lego cars)',
        method: null,
        metadata: null,
        status: 'open',
        isCancelable: false,
        locale: 'nl_NL',
        profileId: 'pfl_URR55HPMGx',
        orderId: 'ord_kEn1PlbGa',
        sequenceType: 'oneoff',
        redirectUrl: 'https://example.org/redirect',
        _links: {
          self: {
            href: 'https://api.mollie.com/v2/payments/tr_ncaPcAhuUV',
            type: 'application/hal+json',
          },
          checkout: {
            href: 'https://www.mollie.com/payscreen/select-method/ncaPcAhuUV',
            type: 'text/html',
          },
          dashboard: {
            href: 'https://www.mollie.com/dashboard/org_123456789/payments/tr_ncaPcAhuUV',
            type: 'text/html',
          },
          order: {
            href: 'https://api.mollie.com/v2/orders/ord_kEn1PlbGa',
            type: 'application/hal+json',
          },
        },
      },
    ],
    refunds: [
      {
        resource: 'refund',
        id: 're_vD3Jm32wQt',
        amount: {
          value: '329.99',
          currency: 'EUR',
        },
        status: 'pending',
        createdAt: '2019-01-15T15:41:21+00:00',
        description: 'Required quantity not in stock, refunding one photo book.',
        orderId: 'ord_kEn1PlbGa',
        paymentId: 'tr_mjvPwykz3x',
        settlementAmount: {
          value: '-329.99',
          currency: 'EUR',
        },
        lines: [
          {
            resource: 'orderline',
            id: 'odl_dgtxyl',
            orderId: 'ord_kEn1PlbGa',
            name: 'LEGO 42056 Porsche 911 GT3 RS',
            sku: '5702015594028',
            type: 'physical',
            status: 'completed',
            isCancelable: false,
            quantity: 1,
            unitPrice: {
              value: '329.99',
              currency: 'EUR',
            },
            vatRate: '21.00',
            vatAmount: {
              value: '57.27',
              currency: 'EUR',
            },
            totalAmount: {
              value: '329.99',
              currency: 'EUR',
            },
            createdAt: '2019-01-15T15:22:45+00:00',
            _links: {
              productUrl: {
                href: 'https://shop.lego.com/nl-NL/Porsche-911-GT3-RS-42056',
                type: 'text/html',
              },
              imageUrl: {
                href: 'https://sh-s7-live-s.legocdn.com/is/image/LEGO/42056?$PDPDefault$',
                type: 'text/html',
              },
            },
          },
        ],
        _links: {
          self: {
            href: 'https://api.mollie.com/v2/payments/tr_mjvPwykz3x/refunds/re_vD3Jm32wQt',
            type: 'application/hal+json',
          },
          payment: {
            href: 'https://api.mollie.com/v2/payments/tr_mjvPwykz3x',
            type: 'application/hal+json',
          },
          order: {
            href: 'https://api.mollie.com/v2/orders/ord_kEn1PlbGa',
            type: 'application/hal+json',
          },
        },
      },
    ],
  },
};

// Contains expired and paid payment
export const mockPaidOrder = {
  resource: 'order',
  id: 'ord_12345',
  profileId: 'pfl_VtWA783A63',
  method: 'ideal',
  amount: {
    value: '31.04',
    currency: 'EUR',
  },
  status: 'paid',
  isCancelable: false,
  metadata: {
    cartId: '7e3fc8b1-f3e8-49d3-b86b-2fd152d66bfe',
  },
  createdAt: '2021-12-23T09:18:26+00:00',
  mode: 'test',
  locale: 'nl_NL',
  shopperCountryMustMatchBillingCountry: false,
  orderNumber: '18e822de-e148-4579-aaa4-e5bb08ac90e4',
  amountCaptured: {
    value: '31.04',
    currency: 'EUR',
  },
  paidAt: '2022-01-03T15:42:58+00:00',
  redirectUrl: 'https://www.redirect.url/',
  webhookUrl: 'https://www.webhook.url',
  lines: [],
  _embedded: {
    payments: [
      {
        resource: 'payment',
        id: 'tr_PT2VFFtKEu',
        mode: 'test',
        createdAt: '2021-12-23T09:18:26+00:00',
        amount: {
          value: '31.04',
          currency: 'EUR',
        },
        description: 'Order 18e822de-e148-4579-aaa4-e5bb08ac90e4',
        method: 'ideal',
        metadata: null,
        status: 'expired',
        expiredAt: '2021-12-23T09:35:02+00:00',
        locale: 'nl_NL',
        profileId: 'pfl_VtWA783A63',
        orderId: 'ord_mgkfh2',
        sequenceType: 'oneoff',
        redirectUrl: 'https://www.redirect.url/',
        webhookUrl: 'https://www.webhook.url',
        _links: {
          self: {
            href: 'https://api.mollie.com/v2/payments/tr_PT2VFFtKEu',
            type: 'application/hal+json',
          },
          dashboard: {
            href: 'https://www.mollie.com/dashboard/org_12932188/payments/tr_PT2VFFtKEu',
            type: 'text/html',
          },
          order: {
            href: 'https://api.mollie.com/v2/orders/ord_mgkfh2',
            type: 'application/hal+json',
          },
        },
      },
      {
        resource: 'payment',
        id: 'tr_ncaPcAhuUV',
        mode: 'test',
        createdAt: '2022-01-03T15:42:47+00:00',
        amount: {
          value: '31.04',
          currency: 'EUR',
        },
        description: 'Order 18e822de-e148-4579-aaa4-e5bb08ac90e4',
        method: 'klarnapaylater',
        metadata: null,
        status: 'paid',
        paidAt: '2022-01-03T15:42:58+00:00',
        amountRefunded: {
          value: '0.00',
          currency: 'EUR',
        },
        amountRemaining: {
          value: '31.04',
          currency: 'EUR',
        },
        locale: 'nl_NL',
        countryCode: 'NL',
        profileId: 'pfl_VtWA783A63',
        orderId: 'ord_mgkfh2',
        sequenceType: 'oneoff',
        redirectUrl: 'https://www.redirect.url/',
        webhookUrl: 'https://www.webhook.url',
        settlementAmount: {
          value: '31.04',
          currency: 'EUR',
        },
        details: {
          consumerName: 'T. TEST',
          consumerAccount: 'NL61RABO0915599902',
          consumerBic: 'ABNANL2A',
        },
        _links: {
          self: {
            href: 'https://api.mollie.com/v2/payments/tr_ncaPcAhuUV',
            type: 'application/hal+json',
          },
          dashboard: {
            href: 'https://www.mollie.com/dashboard/org_12932188/payments/tr_ncaPcAhuUV',
            type: 'text/html',
          },
          changePaymentState: {
            href: 'https://www.mollie.com/checkout/test-mode?method=ideal&token=3.5dtbc0',
            type: 'text/html',
          },
          order: {
            href: 'https://api.mollie.com/v2/orders/ord_mgkfh2',
            type: 'application/hal+json',
          },
        },
      },
    ],
  },
};
