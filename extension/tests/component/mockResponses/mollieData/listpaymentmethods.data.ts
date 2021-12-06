export const paymentMethodsAvailableResponse = {
  count: 2,
  _embedded: {
    methods: [
      {
        resource: 'method',
        id: 'ideal',
        description: 'iDEAL',
        minimumAmount: {
          value: '0.01',
          currency: 'EUR',
        },
        maximumAmount: {
          value: '50000.00',
          currency: 'EUR',
        },
        image: {
          size1x: 'https://mollie.com/external/icons/payment-methods/ideal.png',
          size2x: 'https://mollie.com/external/icons/payment-methods/ideal%402x.png',
          svg: 'https://mollie.com/external/icons/payment-methods/ideal.svg',
        },
        status: 'activated',
        pricing: [
          {
            description: 'Netherlands',
            fixed: {
              value: '0.29',
              currency: 'EUR',
            },
            variable: '0',
          },
        ],
        _links: {
          self: {
            href: 'https://api.mollie.com/v2/methods/ideal',
            type: 'application/hal+json',
          },
        },
      },
      {
        resource: 'method',
        id: 'creditcard',
        description: 'Credit card',
        minimumAmount: {
          value: '0.01',
          currency: 'EUR',
        },
        maximumAmount: {
          value: '2000.00',
          currency: 'EUR',
        },
        image: {
          size1x: 'https://mollie.com/external/icons/payment-methods/creditcard.png',
          size2x: 'https://mollie.com/external/icons/payment-methods/creditcard%402x.png',
          svg: 'https://mollie.com/external/icons/payment-methods/creditcard.svg',
        },
        status: 'activated',
        pricing: [
          {
            description: 'Commercial & non-European cards',
            fixed: {
              value: '0.25',
              currency: 'EUR',
            },
            variable: '2.8',
            feeRegion: 'other',
          },
          {
            description: 'European cards',
            fixed: {
              value: '0.25',
              currency: 'EUR',
            },
            variable: '1.8',
            feeRegion: 'eu-cards',
          },
          {
            description: 'American Express',
            fixed: {
              value: '0.25',
              currency: 'EUR',
            },
            variable: '2.8',
            feeRegion: 'amex',
          },
        ],
        _links: {
          self: {
            href: 'https://api.mollie.com/v2/methods/creditcard',
            type: 'application/hal+json',
          },
        },
      },
    ],
  },
  _links: {
    self: {
      href: 'https://api.mollie.com/v2/methods',
      type: 'application/hal+json',
    },
    documentation: {
      href: 'https://docs.mollie.com/reference/v2/methods-api/list-methods',
      type: 'text/html',
    },
  },
};

export const noPaymentMethodsAvailableResponse = {
  _embedded: {
    methods: [],
  },
  count: 0,
  _links: {
    documentation: {
      href: 'https://docs.mollie.com/reference/v2/methods-api/list-methods',
      type: 'text/html',
    },
    self: {
      href: 'https://api.mollie.com/v2/methods?amount%5Bvalue%5D=10&amount%5Bcurrency%5D=ISK&resource=orders',
      type: 'application/hal+json',
    },
  },
};

export const amountCurrencyMissingResponse = {
  status: 400,
  title: 'Bad Request',
  detail: 'The currency is missing from the amount',
  field: 'amount.currency',
  _links: {
    documentation: {
      href: 'https://docs.mollie.com/overview/handling-errors',
      type: 'text/html',
    },
  },
};
