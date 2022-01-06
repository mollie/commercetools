import { Payment } from '@mollie/api-client';
import { HandleRequestInput, HandleRequestOutput, HandleRequestFailure, HandleRequestSuccess } from '../types/requestHandlerTypes';
import { CTTransaction } from '../types/ctPaymentTypes';
import { CTUpdateAction } from '../types/ctUpdateActions';
import config from '../../config/config';
import { initialiseCommercetoolsClient, initialiseMollieClient } from '../client/index';
import { getTransactionStateUpdateOrderActions, getPaymentStatusUpdateAction, isOrderOrPayment, getAddTransactionUpdateActions, getRefundStatusUpdateActions } from '../utils';
import actions from './index';
import Logger from '../logger/logger';
import { makeActions } from '../makeActions';

const mollieClient = initialiseMollieClient();
const commercetoolsClient = initialiseCommercetoolsClient();
const {
  commercetools: { projectKey },
} = config;

/**
 * handleRequest
 * @param req Request
 * @param res Response
 */
export default async function handleRequest(input: HandleRequestInput): Promise<HandleRequestOutput> {
  // Only accept '/' endpoint
  if (input.httpPath !== '/') {
    Logger.http(`Path ${input.httpPath} not allowed`);
    return new HandleRequestFailure(400);
  }
  if (input.httpMethod !== 'POST') {
    Logger.http(`Method ${input.httpMethod} not allowed`);
    return new HandleRequestFailure(405);
  }

  try {
    const {
      httpBody: { id },
    } = input;
    // Receive webhook trigger from Mollie with order or payment ID
    const resourceType = isOrderOrPayment(id);
    if (resourceType === 'invalid') {
      Logger.error(`ID ${id} is invalid`);
      return new HandleRequestSuccess(200);
    }

    // Order or Payment flow will populate the updated actions
    let updateActions: CTUpdateAction[] = [];
    let mollieOrderId;
    let ctPaymentVersion;

    // Order webhook - updateActions
    if (resourceType === 'order') {
      const { actions, version } = await handleOrderWebhook(id);
      updateActions.concat(actions);
      ctPaymentVersion = version;
    }
    // Payment webhook - updateActions
    else {
      const { actions, version } = await handlePaymentWebhook(id);
      updateActions.concat(actions);
      ctPaymentVersion = version;
    }

    // Update the CT Payment
    const ctKey = resourceType === 'order' ? id : mollieOrderId;
    await actions.ctUpdatePaymentByKey(ctKey, commercetoolsClient, projectKey, ctPaymentVersion, updateActions);
    return new HandleRequestSuccess(200);
  } catch (error: any) {
    Logger.error({ error });
    // TODO: change to handlerequestfailure and return 4xx/5xx with no message
    return new HandleRequestSuccess(200);
  }
}

export async function handleOrderWebhook(id: string): Promise<{ actions: CTUpdateAction[]; version: number }> {
  let updateActions: CTUpdateAction[] = [];
  const order = await actions.mGetOrderDetailsById(id, mollieClient);
  const mollieOrderStatus = order.status;
  const molliePayments = order._embedded?.payments;

  const ctPayment = await actions.ctGetPaymentByKey(id, commercetoolsClient, projectKey);
  const ctOrderStatus = ctPayment.custom?.fields.mollieOrderStatus;

  if (mollieOrderStatus !== ctOrderStatus) {
    updateActions.push(makeActions.setStatusInterfaceText(mollieOrderStatus));
  }

  // TODO: refactor into one function (rename functions)
  // Update the CT transactions array to reflect the status of the mollie payments array
  const transactionStateUpdateOrderActions = getTransactionStateUpdateOrderActions(ctPayment.transactions || ([] as CTTransaction[]), molliePayments);
  if (transactionStateUpdateOrderActions.length) {
    updateActions.push(...transactionStateUpdateOrderActions);
  }

  // If a mollie payment exists that doesn't exist on CT, add it
  const newCtTransactions = getAddTransactionUpdateActions(ctPayment.transactions || ([] as CTTransaction[]), molliePayments as Payment[]);
  if (newCtTransactions.length) {
    updateActions.push(...newCtTransactions);
  }

  return {
    actions: updateActions,
    version: ctPayment.version,
  };
}

export async function handlePaymentWebhook(id: string): Promise<{ actions: CTUpdateAction[]; version: number }> {
  let updateActions: CTUpdateAction[] = [];
  const molliePayment = await actions.mGetPaymentDetailsById(id, mollieClient);
  const mollieOrderId = molliePayment.orderId ?? '';
  const ctPayment = await actions.ctGetPaymentByKey(mollieOrderId, commercetoolsClient, projectKey);
  const ctTransactions = ctPayment.transactions || [];
  const paymentStatusUpdateAction = getPaymentStatusUpdateAction(ctTransactions, molliePayment);
  if (paymentStatusUpdateAction) {
    updateActions.push(paymentStatusUpdateAction);
  }
  // REFUNDS
  const refunds = molliePayment._embedded?.refunds;
  if (refunds?.length) {
    const refundUpdateActions = getRefundStatusUpdateActions(ctTransactions, refunds);
    updateActions.push(...refundUpdateActions);
  }

  return {
    actions: updateActions,
    version: ctPayment.version,
  };
}
