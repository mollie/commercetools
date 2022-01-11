import { Payment, Refund, PaymentMethod } from '@mollie/api-client';
import { molliePaymentToCTStatusMap, mollieRefundToCTStatusMap, shouldPaymentStatusUpdate, shouldRefundStatusUpdate } from './shouldStatusUpdate';
import { makeActions } from '../../makeActions';
import { CTTransaction, CTTransactionType } from '../../types/ctPayment';
import { AddTransaction, ChangeTransactionState, UpdateActionKey } from '../../types/ctUpdateActions';
import { convertMollieAmountToCTMoney } from '../../utils';

const PAY_LATER_ENUMS = [PaymentMethod.klarnapaylater, PaymentMethod.klarnasliceit];

/**
 * @param molliePayments: single mollie payment
 * @param ctTransactions: array of commercetools transactions
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
export const getMatchingMolliePayment = (molliePayments: Payment[], ctInteractionId: string): any => {
  return molliePayments.find(payment => payment.id === ctInteractionId) || {};
};

// ORDER FUNCTIONS //

/**
 *
 * @param ctTransactions: array of commercetools transactions
 * @param molliePayments: array of mollie payments
 * @returns array of addTransaction updateActions.
 *
 * Checks to see if there are new payments against the mollie order that aren't present on commercetools Transactions.
 * If there are, this function will return an array of addTransaction actions
 * This occurs when the customer fails to make a payment through the checkout url. A new payment is created under the order in mollie
 * for each attempt.
 *
 * For pay now methods, this creates a corresponding Charge Transaction in commercetools
 * For pay later methods, this creates a corresponding Authorization Transaction in commercetools
 */

export const getAddTransactionUpdateActions = (ctTransactions: CTTransaction[], molliePayments: Payment[]): AddTransaction[] => {
  // Determine if paynow or paylater method
  const paymentMethod = molliePayments[0].method as PaymentMethod; // prevents typescript error that expects this to be PaymentMethod | HistoricPaymentMethod
  const isPayLater = PAY_LATER_ENUMS.includes(paymentMethod);

  // Find payments which do not exist in CT Transactions
  const updateActions: AddTransaction[] = [];
  for (let molliePayment of molliePayments) {
    if (!existsInCtTransactionsArray(molliePayment, ctTransactions)) {
      // Add corresponding CT Transaction
      const addTransaction = makeActions.addTransaction(
        isPayLater ? CTTransactionType.Authorization : CTTransactionType.Charge,
        { currency: molliePayment.amount.currency, value: molliePayment.amount.value },
        molliePayment.id,
        molliePaymentToCTStatusMap[molliePayment.status],
        molliePayment.createdAt,
      );
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
 * Creates an array of changeTransactionState actions, which update commercetools Transactions based on their corresponding mollie payment state.
 */
export const getTransactionStateUpdateOrderActions = (ctTransactions: CTTransaction[], molliePayments: Payment[]): ChangeTransactionState[] => {
  const changeTransactionStateUpdateActions: ChangeTransactionState[] = [];
  if (ctTransactions.length > 0) {
    for (let ctTransaction of ctTransactions) {
      let matchingMolliePayment = getMatchingMolliePayment(molliePayments, ctTransaction.interactionId || '');
      // Check if we found a matching mollie payment
      if (matchingMolliePayment.status) {
        let shouldUpdate = shouldPaymentStatusUpdate(matchingMolliePayment.status, ctTransaction.state);
        if (shouldUpdate) {
          changeTransactionStateUpdateActions.push(makeActions.changeTransactionState(ctTransaction.id, molliePaymentToCTStatusMap[matchingMolliePayment.status]));
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
  const { id: molliePaymentId, status: molliePaymentStatus, method: paymentMethod } = molliePayment;

  // Determine if paynow or paylater method
  const isPayLater = PAY_LATER_ENUMS.includes(paymentMethod as PaymentMethod);
  const matchingTransaction = ctTransactions.find(transaction => transaction.interactionId === molliePaymentId);

  // If no corresponding CT Transaction, create it
  if (matchingTransaction === undefined) {
    const addTransaction: AddTransaction = {
      action: UpdateActionKey.AddTransaction,
      transaction: {
        amount: convertMollieAmountToCTMoney(molliePayment.amount),
        state: molliePaymentToCTStatusMap[molliePaymentStatus],
        type: isPayLater ? CTTransactionType.Authorization : CTTransactionType.Charge,
        interactionId: molliePaymentId,
      },
    };
    return addTransaction;
  }

  // Corresponding transaction, update it
  const shouldUpdate = shouldPaymentStatusUpdate(molliePaymentStatus, matchingTransaction.state);
  if (shouldUpdate) {
    return makeActions.changeTransactionState(matchingTransaction.id, molliePaymentToCTStatusMap[molliePaymentStatus]);
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
