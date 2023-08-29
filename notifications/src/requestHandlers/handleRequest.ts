import { HandleRequestInput, HandleRequestOutput, HandleRequestFailure, HandleRequestSuccess } from '../types/requestHandler';
import config from '../../config/config';
import { initialiseCommercetoolsClient, initialiseMollieClient } from '../client/index';
import { isOrderOrPayment } from '../utils';
import Logger from '../logger/logger';
import { handleOrderWebhook } from './webhookHandlers/handleOrderWebhook';
import { handlePaymentWebhook } from './webhookHandlers/handlePaymentWebhook';

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
  if ((input.httpPath ?? '/') !== '/') {
    Logger.http(`Path ${input.httpPath} not allowed`);
    return new HandleRequestFailure(400);
  }
  if ((input.httpMethod ?? 'POST') !== 'POST') {
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

    // Call the payment or order webhook handler, which updates the commercetools Payment
    const webhookHandler = resourceType === 'order' ? handleOrderWebhook : handlePaymentWebhook;
    const updatedPayment = await webhookHandler(payloadId, mollieClient, commercetoolsClient);

    Logger.debug(`Commercetools Payment id ${updatedPayment.id} updated to version ${updatedPayment.version}`);
    return new HandleRequestSuccess(200);
  } catch (error: any) {
    Logger.error({ error });
    // Mollie docs recommend to return 200 even if the ID is not known to our system
    // https://docs.mollie.com/overview/webhooks
    if (error.status === 404 && error.source === 'mollie') {
      return new HandleRequestSuccess(200);
    }
    return new HandleRequestFailure(400);
  }
}
