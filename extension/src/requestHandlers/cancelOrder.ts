import { MollieClient, Order, OrderLineCancelParams } from '@mollie/api-client';
import Logger from '../logger/logger';
import formatErrorResponse from '../errorHandlers';
import { Action, ControllerAction, CTPayment, CTTransactionType, CTUpdatesRequestedResponse } from '../types';
import { isPartialTransaction, findInitialTransaction, ctToMollieLines } from '../utils';
import { makeActions } from '../makeActions';

export function getCancelOrderParams(ctPayment: Required<CTPayment>, mollieOrder: Order | undefined): Promise<OrderLineCancelParams> {
  try {
    const initialCharge = findInitialTransaction(ctPayment.transactions, CTTransactionType.CancelAuthorization);
    const cancelOrderParams = {
      orderId: ctPayment.key,
      lines: ctToMollieLines(initialCharge!, mollieOrder!.lines),
    };

    return Promise.resolve(cancelOrderParams);
  } catch (error) {
    Logger.error({ error });
    return Promise.reject({ status: 400, title: 'Could not make parameters required to cancel Mollie order.', field: 'createCancelOrderRequest' });
  }
}

export function createCtActions(mollieCancelOrderRes: Order, ctObj: any): Action[] {
  const stringifiedCancelOrderResponse = JSON.stringify(mollieCancelOrderRes);
  const actions: Action[] = [];
  const interfaceInteractionParams = {
    actionType: ControllerAction.CancelOrder,
    requestValue: ctObj?.custom?.fields?.createCancelOrderRequest,
    responseValue: stringifiedCancelOrderResponse,
  };
  actions.push(makeActions.addInterfaceInteraction(interfaceInteractionParams), makeActions.setCustomField('createCancelOrderResponse', stringifiedCancelOrderResponse));

  return actions;
}
export default async function cancelOrder(ctPayment: Required<CTPayment>, mollieClient: MollieClient, getCancelOrderParams: Function, createCtActions: Function): Promise<CTUpdatesRequestedResponse> {
  try {
    const mollieOrderRes = isPartialTransaction(ctPayment.transactions ?? [], CTTransactionType.CancelAuthorization) ? await mollieClient.orders.get(ctPayment.key) : undefined;
    Logger.debug('mollieOrderRes: %o', mollieOrderRes);
    const cancelOrderParams = mollieOrderRes ? await getCancelOrderParams(ctPayment, mollieOrderRes) : undefined;
    Logger.debug('cancelOrderParams: %o', cancelOrderParams);
    const mollieCancelOrderRes = cancelOrderParams ? await mollieClient.orders_lines.cancel(cancelOrderParams) : await mollieClient.orders.cancel(ctPayment.key);
    Logger.debug('mollieCancelOrderRes: %o', mollieCancelOrderRes);
    const ctActions = createCtActions(mollieCancelOrderRes, ctPayment);
    return {
      actions: ctActions,
      status: 200,
    };
  } catch (error: any) {
    Logger.error({ error });
    const errorResponse = formatErrorResponse(error);
    return errorResponse;
  }
}
