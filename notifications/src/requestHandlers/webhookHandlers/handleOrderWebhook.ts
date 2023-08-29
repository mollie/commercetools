import Payment from '@mollie/api-client/dist/types/src/data/payments/Payment';
import { MollieClient } from '@mollie/api-client';
import { CTPayment, CTTransaction } from '../../types/ctPayment';
import { CTUpdateAction } from '../../types/ctUpdateActions';
import actions from '../index';
import { getAddTransactionUpdateActions, getTransactionStateUpdateOrderActions } from './transactionFactory';
import { makeActions } from '../../makeActions';
import config from '../../../config/config';

const {
  commercetools: { projectKey },
} = config;

export function makePaymentUpdateActions(mollieStatus: string, ctStatus: string | undefined) {
  if (mollieStatus !== ctStatus) {
    return makeActions.setStatusInterfaceText(mollieStatus);
  }
}

export function makeTransactionUpdateActions(molliePayments: Payment[], commercetoolsTransactions: CTTransaction[]) {
  let updateActions = [];
  // Update commercetools transactions to match the status of their corresponding mollie payment
  const transactionStateUpdateOrderActions = getTransactionStateUpdateOrderActions(commercetoolsTransactions, molliePayments);
  if (transactionStateUpdateOrderActions.length) {
    updateActions.push(...transactionStateUpdateOrderActions);
  }

  // If a payment exists on the mollie order that doesn't exist in the commercetools transactions, add it
  const newCtTransactions = getAddTransactionUpdateActions(commercetoolsTransactions, molliePayments);
  if (newCtTransactions.length) {
    updateActions.push(...newCtTransactions);
  }
  return updateActions;
}

export async function handleOrderWebhook(mollieOrderId: string, mollieClient: MollieClient, commercetoolsClient: any): Promise<CTPayment> {
  let updateActions: CTUpdateAction[] = [];

  let commerceToolsOrderId = mollieOrderId;
  if (mollieOrderId.substring(5, 6) == '.') {
    commerceToolsOrderId = mollieOrderId.substring(0, 5) + '_' + mollieOrderId.substring(6);
  }

  // Get mollie order info, including payments
  const order = await actions.mGetOrderDetailsById(mollieOrderId, mollieClient);
  const mollieOrderStatus = order.status;
  const molliePayments = order._embedded?.payments ?? ([] as Payment[]);

  // Get commercetools payment info, including transactions
  const ctPayment = await actions.ctGetPaymentByKey(commerceToolsOrderId, commercetoolsClient, projectKey);

  // Create update actions for the commercetools transactions, to match the mollie order's payments
  const transactionUpdates = makeTransactionUpdateActions(molliePayments, ctPayment.transactions || ([] as CTTransaction[]));
  updateActions.push(...transactionUpdates);

  // Update commercetools Payment's status text to match the mollie order's status
  const ctOrderStatus = ctPayment.paymentStatus?.interfaceText;
  const statusInterfaceAction = makePaymentUpdateActions(mollieOrderStatus, ctOrderStatus);
  if (statusInterfaceAction) {
    updateActions.push(statusInterfaceAction);
  }

  // Update the CT Payment
  const updatedPayment = await actions.ctUpdatePaymentByKey(commerceToolsOrderId, commercetoolsClient, projectKey, ctPayment.version, updateActions);

  return updatedPayment;
}
