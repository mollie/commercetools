import { Payment, PaymentStatus } from '@mollie/api-client';
import { CTTransaction, CTTransactionState, CTTransactionType } from './types/ctPaymentTypes';
import { UpdateActionChangeTransactionState, UpdateActionKey, AddTransaction } from './types/ctUpdateActions';

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
 * Map of mollie status to CT Transaction Status
 */
interface StatusMap {
  [key: string]: CTTransactionState;
}

const mollieToCTStatusMap: StatusMap = {
  paid: CTTransactionState.Success,
  authorized: CTTransactionState.Success,
  canceled: CTTransactionState.Failure,
  failed: CTTransactionState.Failure,
  expired: CTTransactionState.Failure,
  open: CTTransactionState.Initial,
  pending: CTTransactionState.Pending,
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
 * Checks to see if there are new mollie payments that aren't present on the CT array, if not then adds an update action to create them in CT.
 * @param ctTransactions: array of commercetools transactions
 * @param molliePayments: array of mollie payments
 * @returns array of addTransaction updateActions.
 */

export const getAddTransactionUpdateActions = (ctTransactions: CTTransaction[], molliePayments: Payment[]): AddTransaction[] => {
  const updateActions: AddTransaction[] = [];
  for (let molliePayment of molliePayments) {
    if (!existsInCtTransactionsArray(molliePayment, ctTransactions)) {
      const addTransaction: AddTransaction = {
        action: UpdateActionKey.AddTransaction,
        transaction: {
          type: CTTransactionType.Charge,
          amount: {
            centAmount: convertMollieToCTPaymentAmount(molliePayment.amount.value),
            currencyCode: molliePayment.amount.currency,
          },
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
 *
 * @param mollieValue e.g. "10.00"
 * @param fractionDigits defaults to 2 in commercetools
 * WIP - does not handle other values of fractionDigits yet
 */
export const convertMollieToCTPaymentAmount = (mollieValue: string, fractionDigits = 2) => {
  return Math.ceil(parseFloat(mollieValue) * Math.pow(10, fractionDigits));
};

/**
 *
 * @param ctTransactions
 * @param molliePayment
 * @returns UpdateAction or void
 */
export const getPaymentStatusUpdateAction = (ctTransactions: CTTransaction[], molliePayment: Payment): UpdateActionChangeTransactionState | AddTransaction | void => {
  const { id: molliePaymentId, status: molliePaymentStatus } = molliePayment;
  const matchingTransaction = ctTransactions.find(transaction => transaction.interactionId === molliePaymentId);

  // If no corresponding CT Transaction, create it
  if (matchingTransaction === undefined) {
    const { newStatus } = shouldPaymentStatusUpdate(molliePaymentStatus, '');
    const addTransaction: AddTransaction = {
      action: UpdateActionKey.AddTransaction,
      transaction: {
        amount: {
          currencyCode: molliePayment.amount.currency,
          centAmount: convertMollieToCTPaymentAmount(molliePayment.amount.value),
        },
        state: newStatus,
        type: CTTransactionType.Charge,
      },
    };
    return addTransaction;
  }

  // Corresponding transaction, update it
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
