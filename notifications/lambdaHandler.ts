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

    type UpdateActionValidType = UpdateActionChangeTransactionState | UpdateActionSetCustomField | AddTransaction;
    type Id = any;
    let updateActions: UpdateActionValidType[] = [];
    let id: Id;
    let mollieOrderId;
    let ctPaymentVersion;
    let resourceTypeToAction = new Map<string, (id: any, ctPaymentVersion: any) => Promise<[UpdateActionValidType[], Id]>>();
    async function handleOrderWebhook(id: any, ctPaymentVersion: any): Promise<[UpdateActionValidType[], Id]> {
      return Promise.resolve([[], '']);
    }
    async function handlePaymentWebhook(id: any, ctPaymentVersion: any): Promise<[UpdateActionValidType[], Id]> {
      return Promise.resolve([[], '']);
    }
    resourceTypeToAction.set('order', handleOrderWebhook);
    resourceTypeToAction.set('payment?', handlePaymentWebhook);

    let resourceType = 'order';
    [updateActions, id] = await resourceTypeToAction.get(resourceType)!('id', 'ctPaymentVersion');

    const ctKey = resourceType === 'order' ? body.id : mollieOrderId;
    await actions.ctUpdatePaymentByKey(ctKey, commercetoolsClient, projectKey, ctPaymentVersion ?? 1, updateActions);
    return;
  } catch (error: any) {
    Logger.error({ error });
    return;
  }
};
