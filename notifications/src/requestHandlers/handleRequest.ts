import { Request, Response } from 'express';
import fetch from 'node-fetch-commonjs';
import createMollieClient from '@mollie/api-client';
import config from '../../config/config';
import { createAuthMiddlewareForClientCredentialsFlow } from '@commercetools/sdk-middleware-auth';
import { createHttpMiddleware } from '@commercetools/sdk-middleware-http';
import { createClient } from '@commercetools/sdk-client';
import actions from './index';
import { isOrderOrPayment } from '../utils';

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
    // Call to mollie's API for order/payment status
    if (resourceType === 'order') {
      const order = await actions.mGetOrderDetailsById(id, mollieClient);
      const { status, payments: molliePayments } = actions.mParseOrder(order);
      mollieOrderStatus = status;
    } else {
      const payment = await actions.mGetPaymentDetailsById(id, mollieClient);
      console.log(payment.id); // To show this is working
      // TODO: https://anddigitaltransformation.atlassian.net/browse/CMI-44
      return res.status(200).send('Payment flow not implemented yet');
    }

    // TODO: Parse for order & payment statuses

    // Get payment from CT -> payment key == mollie order_id
    // Extract current order status
    const ctPayment = await actions.ctGetPaymentByKey(id, commercetoolsClient, projectKey);
    const { version, orderStatus: currentCTOrderStatus } = actions.ctParsePayment(ctPayment);

    // TODO: Parse CT Payment Transactions
    // TODO: should payment status be updated?

    let updateActions = [];

    // should order status be updated?
    if (mollieOrderStatus !== currentCTOrderStatus) {
      const updateOrderStatusAction = {
        action: 'setCustomField',
        name: 'mollieOrderStatus',
        value: mollieOrderStatus,
      };
      updateActions.push(updateOrderStatusAction);
    }

    // TODO: Add payment/transaction update actions

    // TODO: UpdatePaymentByKey on CT
    if (updateActions.length) {
      console.log('updating CT Payment...');
      const newCTPaymentObject = await actions.ctUpdatePaymentByKey(commercetoolsClient, projectKey, id, version, updateActions);
    }

    // No response body required to be sent to Mollie
    res.status(200).end();
  } catch (error) {
    console.error(error);
    res.status(400).send(error);
  }
}
