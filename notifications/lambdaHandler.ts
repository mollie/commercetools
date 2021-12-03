import config from './config/config';
import { initialiseCommercetoolsClient } from './src/client/utils';
import Logger from './src/logger/logger';
import { handleOrderWebhook, handlePaymentWebhook } from './src/requestHandlers/handleRequest';
import actions from './src/requestHandlers/index';
import { AddTransaction, UpdateActionChangeTransactionState, UpdateActionSetCustomField } from './src/types/ctUpdateActions';
import { isOrderOrPayment } from './src/utils';

exports.handler = async (event: any) => {
  try {
    // Reason for this check: if AWS API Gateway is used then event.body is provided as a string payload.
    const body = event.body ? JSON.parse(event.body) : event;
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
