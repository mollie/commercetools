import { Request, Response } from 'express';
import { Payment } from '@mollie/api-client';
import { UpdateActionChangeTransactionState, UpdateActionSetCustomField, AddTransaction } from '../types/ctUpdateActions';
import { CTTransaction } from '../types/ctPaymentTypes';
import { getTransactionStateUpdateOrderActions, getPaymentStatusUpdateAction, isOrderOrPayment, getAddTransactionUpdateActions, getRefundStatusUpdateActions } from '../utils';
import config from '../../config/config';
import actions from './index';
import Logger from '../logger/logger';
import { initialiseCommercetoolsClient, initialiseMollieClient } from '../client/index';
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
export default async function handleRequest(req: Request, res: Response) {
  const {
    body: { id },
    path,
    method,
  } = req;

  // Only accept '/' endpoint
  if (path !== '/') {
    Logger.http(`Path ${path} not allowed`);
    return res.status(400).end();
  }
  if (method !== 'POST') {
    Logger.http(`Method ${method} not allowed`);
    return res.status(405).end();
  }

  try {
    // Receive webhook trigger from Mollie with order or payment ID
    const resourceType = isOrderOrPayment(id);
    if (resourceType === 'invalid') {
      Logger.error(`ID ${id} is invalid`);
      return res.status(200).end();
    }

    // Order or Payment flow will populate the updated actions
    let updateActions: (UpdateActionChangeTransactionState | UpdateActionSetCustomField | AddTransaction)[] = [];
    let mollieOrderId;
    let ctPaymentVersion;

    // Order webhook - updateActions
    if (resourceType === 'order') {
      await handleOrderWebhook(id, ctPaymentVersion, updateActions);
    }
    // Payment webhook - updateActions
    else {
      await handlePaymentWebhook(id, ctPaymentVersion, updateActions, mollieOrderId);
    }

    // Update the CT Payment
    const ctKey = resourceType === 'order' ? id : mollieOrderId;
    await actions.ctUpdatePaymentByKey(ctKey, commercetoolsClient, projectKey, ctPaymentVersion ?? 1, updateActions);

    res.status(200).end();
  } catch (error: any) {
    Logger.error({ error });
    res.status(200).end();
  }
}

export async function handleOrderWebhook(id: any, ctPaymentVersion: any, updateActions: any) {
  const order = await actions.mGetOrderDetailsById(id, mollieClient);
  const mollieOrderStatus = order.status;
  const molliePayments = order._embedded?.payments;

  const ctPayment = await actions.ctGetPaymentByKey(id, commercetoolsClient, projectKey);
  ctPaymentVersion = ctPayment.version;
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
}

export async function handlePaymentWebhook(id: any, ctPaymentVersion: any, updateActions: any, mollieOrderId: any) {
  const molliePayment = await actions.mGetPaymentDetailsById(id, mollieClient);
  mollieOrderId = molliePayment.orderId ?? '';
  const ctPayment = await actions.ctGetPaymentByKey(mollieOrderId, commercetoolsClient, projectKey);
  ctPaymentVersion = ctPayment.version;
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
}
