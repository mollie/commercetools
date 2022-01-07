import { HandleRequestInput, HandleRequestOutput, HandleRequestFailure, HandleRequestSuccess } from '../types/requestHandler';
import config from '../../config/config';
import { initialiseCommercetoolsClient, initialiseMollieClient } from '../client/index';
import { isOrderOrPayment } from '../utils';
import actions from './index';
import Logger from '../logger/logger';
import { handleOrderWebhook } from './handleOrderWebhook';
import { handlePaymentWebhook } from './handlePaymentWebhook';

const mollieClient = initialiseMollieClient();
const commercetoolsClient = initialiseCommercetoolsClient();
const {
  commercetools: { projectKey },
} = config;

/**
 * handleRequest
 * @param input HandleRequestInput
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
      httpBody: { id: payloadId },
    } = input;
    // Receive webhook trigger from Mollie with order or payment ID
    const resourceType = isOrderOrPayment(payloadId);
    if (resourceType === 'invalid') {
      Logger.error(`ID ${payloadId} is invalid`);
      return new HandleRequestSuccess(200);
    }

    // Call the payment or order webhook handler to create array of update actions
    const webhookHandler = resourceType === 'order' ? handleOrderWebhook : handlePaymentWebhook;
    const { actions: updateActions, version, orderId } = await webhookHandler(payloadId, mollieClient, commercetoolsClient);
    const ctPaymentVersion = version;

    // Update the CT Payment
    const ctKey = resourceType === 'order' ? payloadId : orderId;
    await actions.ctUpdatePaymentByKey(ctKey, commercetoolsClient, projectKey, ctPaymentVersion, updateActions);
    return new HandleRequestSuccess(200);
  } catch (error: any) {
    Logger.error({ error });
    // TODO: change to handlerequestfailure and return 4xx/5xx with no message
    return new HandleRequestSuccess(200);
  }
}
