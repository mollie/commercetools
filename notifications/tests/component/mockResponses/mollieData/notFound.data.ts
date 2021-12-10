export const orderNotFoundResponse = {
  status: 404,
  title: 'Not Found',
  detail: 'No order exists with token /token_id/.',
  _links: {
    documentation: {
      href: 'https://docs.mollie.com/overview/handling-errors',
      type: 'text/html',
    },
  },
};

export const paymentotFoundResponse = {};
