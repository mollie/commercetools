import Payment from '@mollie/api-client/dist/types/src/data/payments/Payment';
import { MollieClient } from '@mollie/api-client';
import { CTTransaction } from '../types/ctPayment';
import { WebhookHandlerResponse } from '../types/requestHandler';
import { CTUpdateAction } from '../types/ctUpdateActions';
import actions from './index';
import { getAddTransactionUpdateActions, getTransactionStateUpdateOrderActions } from '../utils';
import { makeActions } from '../makeActions';
import config from '../../config/config';

const {
  commercetools: { projectKey },
} = config;

export async function handleOrderWebhook(mollieOrderId: string, mollieClient: MollieClient, commercetoolsClient: any): Promise<WebhookHandlerResponse> {
  let updateActions: CTUpdateAction[] = [];

  // Get mollie order info, including payments
  const order = await actions.mGetOrderDetailsById(mollieOrderId, mollieClient);
  const mollieOrderStatus = order.status;
  const molliePayments = order._embedded?.payments;

  // Get commercetools payment info, including transactions
  const ctPayment = await actions.ctGetPaymentByKey(mollieOrderId, commercetoolsClient, projectKey);
  const ctOrderStatus = ctPayment.paymentStatus?.interfaceText;

  // Update commercetools Payment's status text to match the mollie order's status
  if (mollieOrderStatus !== ctOrderStatus) {
    updateActions.push(makeActions.setStatusInterfaceText(mollieOrderStatus));
  }

  // Update commercetools transactions to match the status of their corresponding mollie payment
  const transactionStateUpdateOrderActions = getTransactionStateUpdateOrderActions(ctPayment.transactions || ([] as CTTransaction[]), molliePayments);
  if (transactionStateUpdateOrderActions.length) {
    updateActions.push(...transactionStateUpdateOrderActions);
  }

  // If a payment exists on the mollie order that doesn't exist in the commercetools transactions, add it
  const newCtTransactions = getAddTransactionUpdateActions(ctPayment.transactions || ([] as CTTransaction[]), molliePayments as Payment[]);
  if (newCtTransactions.length) {
    updateActions.push(...newCtTransactions);
  }
  return {
    actions: updateActions,
    version: ctPayment.version,
  };
}
