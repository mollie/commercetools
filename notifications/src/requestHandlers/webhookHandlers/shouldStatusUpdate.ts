import { PaymentStatus, RefundStatus } from '@mollie/api-client';
import { CTTransactionState } from '../../types/ctPayment';

interface StatusMap {
  [key: string]: CTTransactionState;
}

/**
 * Map of mollie status to commercetools Transaction Status
 */
export const molliePaymentToCTStatusMap: StatusMap = {
  paid: CTTransactionState.Success,
  authorized: CTTransactionState.Success,
  canceled: CTTransactionState.Failure,
  failed: CTTransactionState.Failure,
  expired: CTTransactionState.Failure,
  open: CTTransactionState.Initial,
  pending: CTTransactionState.Pending,
};

/**
 * Map of mollie refund status to commercetools Transaction Status
 */
export const mollieRefundToCTStatusMap: StatusMap = {
  refunded: CTTransactionState.Success,
  failed: CTTransactionState.Failure,
  queued: CTTransactionState.Pending,
  pending: CTTransactionState.Pending,
  processing: CTTransactionState.Pending,
};

/**
 * @param PaymentStatus - mollie payment status
 * @param ctTransactionState - commercetools Transaction state
 * @returns shouldUpdate: boolean
 *
 * Mollie payment status - https://docs.mollie.com/payments/status-changes
 * Commercetools Transaction states - https://docs.commercetools.com/api/projects/payments#transactionstate
 *
 * commercetools <-> Mollie
 * Success - paid, authorized
 * Failure - expired, canceled, failed
 *
 * N.B. There are other payment states in Mollie, but the webhook will not be called for them
 *
 */

export const shouldPaymentStatusUpdate = (molliePaymentStatus: PaymentStatus, ctTransactionState: CTTransactionState): boolean => {
  let shouldUpdate: boolean;

  switch (molliePaymentStatus) {
    // Success statuses
    case PaymentStatus.paid:
    case PaymentStatus.authorized:
      shouldUpdate = ctTransactionState !== CTTransactionState.Success;
      break;

    // Failure statuses
    case PaymentStatus.canceled:
    case PaymentStatus.failed:
    case PaymentStatus.expired:
      shouldUpdate = ctTransactionState !== CTTransactionState.Failure;
      break;

    default:
      shouldUpdate = false;
      break;
  }
  return shouldUpdate;
};

/**
 * Returns true if mollie refund status has changed and the CT Transaction should be updated
 * @param mollieRefundStatus
 * @param ctTransactionStatus
 */
export const shouldRefundStatusUpdate = (mollieRefundStatus: RefundStatus, ctTransactionStatus: CTTransactionState): boolean => {
  let shouldUpdate: boolean;

  switch (mollieRefundStatus) {
    case RefundStatus.queued:
    case RefundStatus.pending:
    case RefundStatus.processing:
      shouldUpdate = ctTransactionStatus !== CTTransactionState.Pending;
      break;

    case RefundStatus.refunded:
      shouldUpdate = ctTransactionStatus !== CTTransactionState.Success;
      break;

    case RefundStatus.failed:
      shouldUpdate = ctTransactionStatus !== CTTransactionState.Failure;
      break;

    default:
      shouldUpdate = false;
      break;
  }
  return shouldUpdate;
};
