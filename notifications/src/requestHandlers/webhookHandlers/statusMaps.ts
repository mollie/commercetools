import { CTTransactionState } from '../../types/ctPayment';

interface StatusMap {
  [key: string]: CTTransactionState;
}

/**
 * Map of mollie status to commercetools Transaction Status
 */
export const mollieToCTStatusMap: StatusMap = {
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
