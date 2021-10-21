import { Request, Response } from 'express';
import fetch from 'node-fetch-commonjs';
import createMollieClient from '@mollie/api-client';
import config from '../../config/config';
import { createAuthMiddlewareForClientCredentialsFlow } from '@commercetools/sdk-middleware-auth';
import { createHttpMiddleware } from '@commercetools/sdk-middleware-http';
import { createClient } from '@commercetools/sdk-client';
import actions from './index';
import { getTransactionStateUpdateOrderActions, isOrderOrPayment } from '../utils';
import { CTTransaction } from '../types/ctPaymentTypes';
import { UpdateActionKey, UpdateActionChangeTransactionState, UpdateActionSetCustomField } from '../types/ctUpdateActions';

const mollieApiKey = config.mollieApiKey;
const mollieClient = createMollieClient({ apiKey: mollieApiKey });

const {
  ctConfig: { projectKey, clientId, clientSecret, host, authUrl, scopes },
} = config;

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

const commercetoolsClient = createClient({ middlewares: [ctAuthMiddleware, ctHttpMiddleWare] });

/**
 * FLOW TO IMPLEMENT
 * Webhook will call / with order or payment id
 * Call to mollie's API for order/payment status
 * Call to CT for Payment object to update
 * Format update actions for CT
 * Call updatePaymentByKey on CT with new status
 */

/**
 * handleRequest
 * @param req Request
 * @param res Response
 */
export default async function handleRequest(req: Request, res: Response) {
  const {
    body: { id },
    path,
  } = req;
  // Only accept '/' endpoint
  if (path !== '/') return res.sendStatus(400);

  try {
    // Receive webhook trigger from Mollie with order or payment ID
    const resourceType = isOrderOrPayment(id);
    if (resourceType === 'invalid') {
      return res.status(400).send(`ID ${id} is invalid`);
    }
    let mollieOrderStatus;
    let molliePayments;
    let updateActions: (UpdateActionChangeTransactionState | UpdateActionSetCustomField)[] = [];
    // Call to mollie's API for order/payment status
    if (resourceType === 'order') {
      const order = await actions.mGetOrderDetailsById(id, mollieClient);
      mollieOrderStatus = order.status;
      molliePayments = order._embedded?.payments;
    } else {
      const payment = await actions.mGetPaymentDetailsById(id, mollieClient);
      console.log(payment.id); // To show this is working
      // TODO: https://anddigitaltransformation.atlassian.net/browse/CMI-44
      return res.status(200).send('Payment flow not implemented yet');
    }

    // TODO: Parse for order & payment statuses

    // Get payment from CT -> payment key == mollie order_id
    const ctPayment = await actions.ctGetPaymentByKey(id, commercetoolsClient, projectKey);
    const ctVersion = ctPayment.version;
    const ctOrderStatus = ctPayment.custom?.fields.mollieOrderStatus;
    if (mollieOrderStatus !== ctOrderStatus) {
      updateActions.push({
        action: UpdateActionKey.SetCustomField,
        name: 'mollieOrderStatus',
        value: mollieOrderStatus,
      });
    }
    // TODO: Parse CT Payment for transactions & statuses

    const transactionStateUpdateOrderActions = getTransactionStateUpdateOrderActions(ctPayment.transactions || ([] as CTTransaction[]), molliePayments);
    if (transactionStateUpdateOrderActions.length) {
      updateActions.push(...transactionStateUpdateOrderActions);
    }
    // TODO: should order / payment status be updated?

    const updatedPayment = await actions.ctUpdatePaymentByKey(id, commercetoolsClient, projectKey, ctVersion, updateActions);
    // Return ctPayment for now to demo getPaymentByKey
    res.status(200).send(updatedPayment);
  } catch (error) {
    console.error(error);
    res.status(400).send(error);
  }
}
