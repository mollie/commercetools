import { MollieClient, Payment } from '@mollie/api-client';
import { CTUpdateAction } from '../../types/ctUpdateActions';
import { getPaymentStatusUpdateAction, getRefundStatusUpdateActions } from './transactionFactory';
import config from '../../../config/config';
import actions from '../index';
import { CTPayment } from '../../types/ctPayment';

const {
  commercetools: { projectKey },
} = config;

export async function handlePaymentWebhook(molliePaymentId: string, mollieClient: MollieClient, commercetoolsClient: any): Promise<CTPayment> {
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

  // Update the CT Payment
  const updatedPayment = await actions.ctUpdatePaymentByKey(mollieOrderId!, commercetoolsClient, projectKey, ctPayment.version, updateActions);
  return updatedPayment;
}
