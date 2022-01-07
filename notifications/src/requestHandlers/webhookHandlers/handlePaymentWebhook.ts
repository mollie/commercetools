import { MollieClient } from '@mollie/api-client';
import { CTUpdateAction } from '../../types/ctUpdateActions';
import { WebhookHandlerResponse } from '../../types/requestHandler';
import { getPaymentStatusUpdateAction, getRefundStatusUpdateActions } from './transactionFactory';
import config from '../../../config/config';
import actions from '../index';

const {
  commercetools: { projectKey },
} = config;

export async function handlePaymentWebhook(molliePaymentId: string, mollieClient: MollieClient, commercetoolsClient: any): Promise<WebhookHandlerResponse> {
  let updateActions: CTUpdateAction[] = [];

  // Get mollie payment info, including refunds
  const molliePayment = await actions.mGetPaymentDetailsById(molliePaymentId, mollieClient);
  const mollieOrderId = molliePayment.orderId;

  // Get commercetools payment info, including transactions
  const ctPayment = await actions.ctGetPaymentByKey(mollieOrderId!, commercetoolsClient, projectKey);
  const ctTransactions = ctPayment.transactions || [];

  // Find the matching commercetools transaction for this mollie payment, or create it if it does not exist
  const paymentStatusUpdateAction = getPaymentStatusUpdateAction(ctTransactions, molliePayment);
  if (paymentStatusUpdateAction) {
    updateActions.push(paymentStatusUpdateAction);
  }
  // If refunds are present, update their status
  const refunds = molliePayment._embedded?.refunds;
  if (refunds?.length) {
    const refundUpdateActions = getRefundStatusUpdateActions(ctTransactions, refunds);
    updateActions.push(...refundUpdateActions);
  }

  return {
    actions: updateActions,
    version: ctPayment.version,
    orderId: mollieOrderId,
  };
}
