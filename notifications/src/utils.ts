import { PaymentStatus } from '@mollie/api-client';

export const isOrderOrPayment = (resourceId: string): string => {
  const orderRegex = new RegExp('^ord_');
  const paymentRegex = new RegExp('^tr_');
  let result = '';

  switch (true) {
    case orderRegex.test(resourceId):
      result = 'order';
      break;
    case paymentRegex.test(resourceId):
      result = 'payment';
      break;
    default:
      result = 'invalid';
  }
  return result;
};

/**
 * @param molliePaymentStatus
 * @param cTPaymentStatus
 * @returns { shouldUpdate: boolean, newStatus: string}
 * Mollie payment status - https://docs.mollie.com/payments/status-changes
 * Commercetools Transaction states - https://docs.commercetools.com/api/projects/payments#transactionstate
 *
 * CommerceTools <-> Mollie
 * Success - paid, authorized
 * Failure - expired, canceled, failed
 *
 * N.B. There are other payment states in Mollie, but the webhook will not be called for them
 *
 */
export const shouldPaymentStatusUpdate = (molliePaymentStatus: string, cTPaymentStatus: string): { shouldUpdate: boolean; newStatus: string } => {
  let shouldUpdate;
  let newStatus = '';

  switch (molliePaymentStatus) {
    // Success statuses
    case 'paid':
    case 'authorized':
      shouldUpdate = cTPaymentStatus === 'Success' ? false : true;
      newStatus = 'Success';

    // Failure statuses
    case 'expired':
    case 'canceled':
    case 'failed':
      shouldUpdate = cTPaymentStatus === 'Failure' ? false : true;
      newStatus = 'Failure';

    default:
      shouldUpdate = false;
  }
  return { shouldUpdate, newStatus };
};

export const shouldOrderStatusUpdate = (mollieOrderStatus: string, ctOrderStatus: string): boolean => {
  return mollieOrderStatus === ctOrderStatus;
};
