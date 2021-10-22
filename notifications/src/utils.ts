import { Payment, PaymentStatus } from '@mollie/api-client';
import { CTTransaction, CTTransactionState } from './types/ctPaymentTypes';
import { UpdateActionChangeTransactionState, UpdateActionKey } from './types/ctUpdateActions';

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
 * commercetools <-> Mollie
 * Success - paid, authorized
 * Failure - expired, canceled, failed
 *
 * N.B. There are other payment states in Mollie, but the webhook will not be called for them
 *
 */
export const shouldPaymentStatusUpdate = (molliePaymentStatus: string, cTPaymentStatus: string): { shouldUpdate: boolean; newStatus: CTTransactionState } => {
  let shouldUpdate: boolean;
  let newStatus = CTTransactionState.Initial;

  switch (molliePaymentStatus) {
    // Success statuses
    case PaymentStatus.paid:
    case PaymentStatus.authorized:
      shouldUpdate = cTPaymentStatus === 'Success' ? false : true;
      newStatus = CTTransactionState.Success;
      break;

    // Failure statuses
    case PaymentStatus.canceled:
    case PaymentStatus.failed:
    case PaymentStatus.expired:
      shouldUpdate = cTPaymentStatus === 'Failure' ? false : true;
      newStatus = CTTransactionState.Failure;
      break;

    default:
      shouldUpdate = false;
      break;
  }
  return { shouldUpdate, newStatus };
};

/**
 * @param molliePayments: array of mollie payments
 * @param ctInteractionId: commercetools interaction id (same as mollie payment id)
 * @returns molliePayment
 */
export const getMatchingMolliePayment = (molliePayments: any[], ctInteractionId: string): any => {
  return molliePayments.find(payment => payment.id === ctInteractionId) || {};
};

/**
 * Gets an array of transactionStateUpdateOrderActions, a list of commands which tells CT to update transactions based on the corresponding mollie payment states.
 * @param ctTransactions: array of commercetools transactions
 * @param molliePayments: array of mollie payments
 * @returns UpdateActionChangeTransactionState[]
 */
export const getTransactionStateUpdateOrderActions = (ctTransactions: CTTransaction[], molliePayments: any): UpdateActionChangeTransactionState[] => {
  const changeTransactionStateUpdateActions: UpdateActionChangeTransactionState[] = [];
  if (ctTransactions.length > 0) {
    for (let ctTransaction of ctTransactions) {
      let matchingMolliePayment = getMatchingMolliePayment(molliePayments, ctTransaction.interactionId || '');
      // Check if we found a matching mollie payment
      if (matchingMolliePayment.status) {
        let shouldOrderStatusUpdateObject = shouldPaymentStatusUpdate(matchingMolliePayment.status, ctTransaction.state);
        if (shouldOrderStatusUpdateObject.shouldUpdate) {
          changeTransactionStateUpdateActions.push({
            action: UpdateActionKey.ChangeTransactionState,
            transactionId: ctTransaction.id,
            state: shouldOrderStatusUpdateObject.newStatus,
          });
        }
      }
    }
  }
  return changeTransactionStateUpdateActions;
};

/**
 *
 * @param ctTransactions
 * @param molliePayment
 * @returns UpdateAction or void
 */
export const getPaymentStatusUpdateAction = (ctTransactions: CTTransaction[], molliePayment: Payment): UpdateActionChangeTransactionState | void => {
  const { id: molliePaymentId, status: molliePaymentStatus } = molliePayment;
  const matchingTransaction = ctTransactions.find(transaction => transaction.interactionId === molliePaymentId);

  // No corresponding CT Transaction
  if (matchingTransaction === undefined) {
    return;
  }

  const { shouldUpdate, newStatus } = shouldPaymentStatusUpdate(molliePaymentStatus, matchingTransaction.state);
  if (shouldUpdate) {
    const updateAction: UpdateActionChangeTransactionState = {
      action: UpdateActionKey.ChangeTransactionState,
      transactionId: matchingTransaction?.id,
      state: newStatus as CTTransactionState,
    };
    return updateAction;
  }
};
