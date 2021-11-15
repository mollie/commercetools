import { Request, Response } from 'express';
import { version } from '../../package.json';
import fetch from 'node-fetch-commonjs';
import createMollieClient from '@mollie/api-client';
import { Payment } from '@mollie/api-client';
import { createAuthMiddlewareForClientCredentialsFlow } from '@commercetools/sdk-middleware-auth';
import { createHttpMiddleware } from '@commercetools/sdk-middleware-http';
import { createLoggerMiddleware } from '@commercetools/sdk-middleware-logger';
import { createUserAgentMiddleware } from '@commercetools/sdk-middleware-user-agent';
import { createClient } from '@commercetools/sdk-client';
import { UpdateActionKey, UpdateActionChangeTransactionState, UpdateActionSetCustomField, AddTransaction } from '../types/ctUpdateActions';
import { CTTransaction } from '../types/ctPaymentTypes';
import { getTransactionStateUpdateOrderActions, getPaymentStatusUpdateAction, isOrderOrPayment, getAddTransactionUpdateActions, getRefundStatusUpdateActions } from '../utils';
import config from '../../config/config';
import actions from './index';
import Logger from '../logger/logger';

const mollieApiKey = config.mollie.apiKey;
const mollieUserAgentString = `MollieCommercetools-notifications/${version}`;
const mollieClient = createMollieClient({ apiKey: mollieApiKey, versionStrings: mollieUserAgentString });

const {
  commercetools: { projectKey, clientId, clientSecret, host, authUrl, scopes },
} = config;

const userAgentMiddleware = createUserAgentMiddleware({
  libraryName: 'MollieCommercetools-notification',
  libraryVersion: version,
});

const ctAuthMiddleware = createAuthMiddlewareForClientCredentialsFlow({
  host: authUrl,
  projectKey,
  credentials: {
    clientId,
    clientSecret,
  },
  scopes,
  fetch,
});

const ctHttpMiddleWare = createHttpMiddleware({
  host,
  fetch,
});

let commercetoolsClient: any;

if (Logger.level === 'http' || Logger.level === 'verbose' || Logger.level === 'debug') {
  commercetoolsClient = createClient({ middlewares: [userAgentMiddleware, ctAuthMiddleware, ctHttpMiddleWare, createLoggerMiddleware()] });
} else {
  commercetoolsClient = createClient({ middlewares: [userAgentMiddleware, ctAuthMiddleware, ctHttpMiddleWare] });
}

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
      Logger.warn(`ID ${id} is invalid`);
      return res.status(200).end();
    }

    // Order or Payment flow will populate the updated actions
    let updateActions: (UpdateActionChangeTransactionState | UpdateActionSetCustomField | AddTransaction)[] = [];
    let mollieOrderId;
    let ctPaymentVersion;

    // Order webhook - updateActions
    if (resourceType === 'order') {
      const order = await actions.mGetOrderDetailsById(id, mollieClient);
      const mollieOrderStatus = order.status;
      const molliePayments = order._embedded?.payments;

      const ctPayment = await actions.ctGetPaymentByKey(id, commercetoolsClient, projectKey);
      ctPaymentVersion = ctPayment.version;
      const ctOrderStatus = ctPayment.custom?.fields.mollieOrderStatus;

      if (mollieOrderStatus !== ctOrderStatus) {
        updateActions.push({
          action: UpdateActionKey.SetCustomField,
          name: 'mollieOrderStatus',
          value: mollieOrderStatus,
        });
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
    // Payment webhook - updateActions
    else {
      // PAYMENTS
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

    // Update the CT Payment
    const ctKey = resourceType === 'order' ? id : mollieOrderId;
    await actions.ctUpdatePaymentByKey(ctKey, commercetoolsClient, projectKey, ctPaymentVersion ?? 1, updateActions);

    res.status(200).end();
  } catch (error: any) {
    Logger.error({ error });
    res.status(200).end();
  }
}
