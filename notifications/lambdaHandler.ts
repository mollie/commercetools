import config from './config/config';
import { initialiseCommercetoolsClient, initialiseMollieClient } from './src/client/index';
import Logger from './src/logger/logger';
import { handleOrderWebhook, handlePaymentWebhook } from './src/requestHandlers/handleRequest';
import actions from './src/requestHandlers/index';
import { AddTransaction, UpdateActionChangeTransactionState, UpdateActionSetCustomField } from './src/types/ctUpdateActions';
import { isOrderOrPayment } from './src/utils';
import * as qs from 'qs';

exports.lambdaHandler = async (event: any, context: any) => {
  try {

    // Reason for this check: if AWS API Gateway is used then event.body is provided as a string payload.
    const body = event.body ? qs.parse(event.body) : event;


    //
    let response = {
      'statusCode': 200,
      'body': `Hello from lambda ${body.name} with id ${body.id}`}
      return response;

    //
    const {
      commercetools: { projectKey },
    } = config;
    const commercetoolsClient = initialiseCommercetoolsClient();

    const resourceType = isOrderOrPayment(body.id);
    let updateActions: (UpdateActionChangeTransactionState | UpdateActionSetCustomField | AddTransaction)[] = [];
    let mollieOrderId;
    let ctPaymentVersion;
    if (resourceType == 'order') {
      handleOrderWebhook(body.id, ctPaymentVersion, updateActions);
    } else {
      handlePaymentWebhook(body.id, ctPaymentVersion, updateActions, mollieOrderId);
    }
    const ctKey = resourceType === 'order' ? body.id : mollieOrderId;
    await actions.ctUpdatePaymentByKey(ctKey, commercetoolsClient, projectKey, ctPaymentVersion ?? 1, updateActions);
    return;
  } catch (error: any) {
    Logger.error({ error });
    return;
  }
};
