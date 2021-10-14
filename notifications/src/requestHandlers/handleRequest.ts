import { Request, Response } from 'express';
import fetch from 'node-fetch-commonjs';
import createMollieClient, { MollieClient } from '@mollie/api-client';
import config from '../../config/config';
import { createAuthMiddlewareForClientCredentialsFlow } from '@commercetools/sdk-middleware-auth';
import { createHttpMiddleware } from '@commercetools/sdk-middleware-http';
import { createClient } from '@commercetools/sdk-client';
import actions from './index';
import { isOrderOrPayment } from '../utils';

const mollieApiKey = config.mollieApiKey;
const mollieClient: MollieClient = createMollieClient({ apiKey: mollieApiKey });

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
  // Only accept '/' endpoint
  const {
    body: { id },
    path,
  } = req;
  if (path !== '/') return res.sendStatus(400);
  try {
    // Receive call from webhook with body { id: <resource_id> }
    const resourceType = isOrderOrPayment(id);
    if (resourceType === 'invalid') {
      return res.sendStatus(400);
    }

    // Call to mollie's API for order/payment status
    if (resourceType === 'order') {
      const order = await actions.getOrderDetailsById(id, mollieClient);
      return res.status(200).send(order);
    } else {
      const payment = await actions.getPaymentDetailsById(id, mollieClient);
      return res.status(200).send(payment);
    }
  } catch (error) {
    console.error(error);
    res.status(400).send(error);
  }
}
