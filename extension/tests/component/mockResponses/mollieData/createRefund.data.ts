import { Refund, RefundStatus } from '@mollie/api-client';

export const refundCreated = {
  resource: 'refund',
  id: 're_sANm7WTxRm',
  amount: {
    value: '55.00',
    currency: 'EUR',
  },
  status: RefundStatus.pending,
  createdAt: '2022-01-17T11:12:45+00:00',
  description: 'Discount due to late delivery',
  metadata: {
    code: 'LI_243',
    customerRequested: true,
  },
  orderId: 'ord_u34rzi',
  paymentId: 'tr_vsfkQmj4Fd',
  settlementAmount: {
    value: '-55.00',
    currency: 'EUR',
  },
  lines: [],
  _links: {
    self: {
      href: 'https://api.mollie.com/v2/payments/tr_vsfkQmj4Fd/refunds/re_sANm7WTxRm',
      type: 'application/hal+json',
    },
    payment: {
      href: 'https://api.mollie.com/v2/payments/tr_vsfkQmj4Fd',
      type: 'application/hal+json',
    },
    order: {
      href: 'https://api.mollie.com/v2/orders/ord_u34rzi',
      type: 'application/hal+json',
    },
    documentation: {
      href: 'https://docs.mollie.com/reference/v2/refunds-api/create-refund',
      type: 'text/html',
    },
  },
} as any as Refund;

export const refundError422 = {
  status: 422,
  title: 'Unprocessable Entity',
  detail: 'The specified amount cannot be refunded',
  field: 'amount.value',
  _links: {
    documentation: {
      href: 'https://docs.mollie.com/overview/handling-errors',
      type: 'text/html',
    },
  },
};
