import { PaymentStatus } from '@mollie/api-client/dist/types/src/data/payments/data';
import Payment from '@mollie/api-client/dist/types/src/data/payments/Payment';
import { RefundStatus } from '@mollie/api-client/dist/types/src/data/refunds/data';
import { mollieToCTStatusMap, mollieRefundToCTStatusMap } from './statusMaps';
import { makeActions } from '../../makeActions';
import { CTTransaction, CTTransactionState, CTTransactionType } from '../../types/ctPayment';
import { AddTransaction, ChangeTransactionState, UpdateActionKey } from '../../types/ctUpdateActions';
import { convertMollieAmountToCTMoney } from '../../utils';
import Refund from '@mollie/api-client/dist/types/src/data/refunds/Refund';

// SUPPORTING CAST //

// FIND X IN Y, Y IN X //
/**
 * @param molliePayments: array of mollie payments
 * @param ctInteractionId: commercetools interaction id (same as mollie payment id)
 * @returns molliePayment
 */
export const existsInCtTransactionsArray = (molliePayment: Payment, ctTransactions: CTTransaction[]): boolean => {
  if (ctTransactions.find(transaction => transaction.interactionId === molliePayment.id)) {
    return true;
  }
  return false;
};

/**
 * @param molliePayments: array of mollie payments
 * @param ctInteractionId: commercetools interaction id (same as mollie payment id)
 * @returns molliePayment
 */
export const getMatchingMolliePayment = (molliePayments: any[], ctInteractionId: string): any => {
  return molliePayments.find(payment => payment.id === ctInteractionId) || {};
};

// SHOULD STATUS UPDATE ? //

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
  let newStatus = mollieToCTStatusMap[PaymentStatus.open];

  switch (molliePaymentStatus) {
    // Success statuses
    case PaymentStatus.paid:
    case PaymentStatus.authorized:
      shouldUpdate = cTPaymentStatus === 'Success' ? false : true;
      newStatus = mollieToCTStatusMap[PaymentStatus.paid];
      break;

    // Failure statuses
    case PaymentStatus.canceled:
    case PaymentStatus.failed:
    case PaymentStatus.expired:
      shouldUpdate = cTPaymentStatus === 'Failure' ? false : true;
      newStatus = mollieToCTStatusMap[PaymentStatus.canceled];
      break;

    default:
      shouldUpdate = false;
      break;
  }
  return { shouldUpdate, newStatus };
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
      shouldUpdate = ctTransactionStatus === CTTransactionState.Pending ? false : true;
      break;

    case RefundStatus.refunded:
      shouldUpdate = ctTransactionStatus === CTTransactionState.Success ? false : true;
      break;

    case RefundStatus.failed:
      shouldUpdate = ctTransactionStatus === CTTransactionState.Failure ? false : true;
      break;

    default:
      shouldUpdate = false;
      break;
  }
  return shouldUpdate;
};

// ORDER FUNCTIONS //

/**
 *
 * @param ctTransactions: array of commercetools transactions
 * @param molliePayments: array of mollie payments
 * @returns array of addTransaction updateActions.
 *
 * Checks to see if there are new payments against the mollie order that aren't present on commercetools Transactions.
 * If there are, these will be created in commercetools
 * This occurs when the customer fails to make a payment through the checkout url. A new payment is created under the order in mollie
 * for each attempt.
 */
export const getAddTransactionUpdateActions = (ctTransactions: CTTransaction[], molliePayments: Payment[]): AddTransaction[] => {
  const updateActions: AddTransaction[] = [];
  for (let molliePayment of molliePayments) {
    if (!existsInCtTransactionsArray(molliePayment, ctTransactions)) {
      const addTransaction: AddTransaction = {
        action: UpdateActionKey.AddTransaction,
        transaction: {
          type: CTTransactionType.Authorization,
          amount: convertMollieAmountToCTMoney(molliePayment.amount),
          timestamp: molliePayment.createdAt,
          interactionId: molliePayment.id,
          state: mollieToCTStatusMap[molliePayment.status],
        },
      };
      updateActions.push(addTransaction);
    }
  }
  return updateActions;
};

/**
 * @param ctTransactions: array of commercetools transactions
 * @param molliePayments: array of mollie payments
 * @returns ChangeTransactionState[]
 *
 * Gets an array of transactionStateUpdateOrderActions, a list of commands which tells CT to update transactions based on the corresponding mollie payment states.
 */
export const getTransactionStateUpdateOrderActions = (ctTransactions: CTTransaction[], molliePayments: any): ChangeTransactionState[] => {
  const changeTransactionStateUpdateActions: ChangeTransactionState[] = [];
  if (ctTransactions.length > 0) {
    for (let ctTransaction of ctTransactions) {
      let matchingMolliePayment = getMatchingMolliePayment(molliePayments, ctTransaction.interactionId || '');
      // Check if we found a matching mollie payment
      if (matchingMolliePayment.status) {
        let shouldOrderStatusUpdateObject = shouldPaymentStatusUpdate(matchingMolliePayment.status, ctTransaction.state);
        if (shouldOrderStatusUpdateObject.shouldUpdate) {
          changeTransactionStateUpdateActions.push(makeActions.changeTransactionState(ctTransaction.id, shouldOrderStatusUpdateObject.newStatus));
        }
      }
    }
  }
  return changeTransactionStateUpdateActions;
};

// PAYMENT FUNCTIONS //

/**
 *
 * @param ctTransactions
 * @param molliePayment
 * @returns UpdateAction or void
 */
export const getPaymentStatusUpdateAction = (ctTransactions: CTTransaction[], molliePayment: Payment): ChangeTransactionState | AddTransaction | void => {
  const { id: molliePaymentId, status: molliePaymentStatus } = molliePayment;
  const matchingTransaction = ctTransactions.find(transaction => transaction.interactionId === molliePaymentId);

  // If no corresponding CT Transaction, create it
  if (matchingTransaction === undefined) {
    const { newStatus } = shouldPaymentStatusUpdate(molliePaymentStatus, '');
    const addTransaction: AddTransaction = {
      action: UpdateActionKey.AddTransaction,
      transaction: {
        amount: convertMollieAmountToCTMoney(molliePayment.amount),
        state: newStatus,
        type: CTTransactionType.Authorization,
      },
    };
    return addTransaction;
  }

  // Corresponding transaction, update it
  const { shouldUpdate, newStatus } = shouldPaymentStatusUpdate(molliePaymentStatus, matchingTransaction.state);
  if (shouldUpdate) {
    return makeActions.changeTransactionState(matchingTransaction.id, newStatus);
  }
};

/**
 * @param ctTransactions
 * @param mollieRefunds
 *
 * Process mollie refunds and match to corresponding commercetools transaction
 * Update the existing transactions if the status has changed
 * If there is a refund and no corresponding transaction, add it to commercetools
 */
export const getRefundStatusUpdateActions = (ctTransactions: CTTransaction[], mollieRefunds: Refund[]): (ChangeTransactionState | AddTransaction)[] => {
  const updateActions: (ChangeTransactionState | AddTransaction)[] = [];
  const refundTransactions = ctTransactions?.filter(ctTransaction => ctTransaction.type === CTTransactionType.Refund);

  mollieRefunds.forEach(mollieRefund => {
    const { id: mollieRefundId, status: mollieRefundStatus } = mollieRefund;
    const matchingCTTransaction = refundTransactions.find(rt => rt.interactionId === mollieRefundId);

    if (matchingCTTransaction) {
      const shouldUpdate = shouldRefundStatusUpdate(mollieRefundStatus, matchingCTTransaction.state);
      if (shouldUpdate) {
        const updateAction = makeActions.changeTransactionState(matchingCTTransaction.id, mollieRefundToCTStatusMap[mollieRefundStatus]);
        updateActions.push(updateAction);
      }
    } else {
      // add corresponding Transaction to CT to keep inline with mollie
      const updateAction: AddTransaction = {
        action: UpdateActionKey.AddTransaction,
        transaction: {
          type: CTTransactionType.Refund,

          amount: convertMollieAmountToCTMoney(mollieRefund.amount),
          interactionId: mollieRefundId,
          state: mollieRefundToCTStatusMap[mollieRefundStatus],
        },
      };
      updateActions.push(updateAction);
    }
  });
  return updateActions;
};
