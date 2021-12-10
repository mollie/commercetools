import { MollieClient, Order, OrderLineCancelParams } from '@mollie/api-client';
import Logger from '../logger/logger';
import formatErrorResponse from '../errorHandlers';
import { Action, ControllerAction, CTUpdatesRequestedResponse } from '../types';
import { makeActions, makeMollieLineAmounts } from '../utils';

export function getCancelOrderParams(ctObj: any): Promise<OrderLineCancelParams> {
  try {
    const parsedCancelOrderRequest = JSON.parse(ctObj?.custom?.fields?.createCancelOrderRequest);
    const mollieAdjustedLines = makeMollieLineAmounts(parsedCancelOrderRequest);
    const cancelOrderParams = {
      orderId: ctObj?.key,
      lines: mollieAdjustedLines,
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
  actions.push(
    makeActions.addInterfaceInteraction(ControllerAction.CancelOrder, ctObj?.custom?.fields?.createCancelOrderRequest, stringifiedCancelOrderResponse),
    makeActions.setCustomField('createCancelOrderResponse', stringifiedCancelOrderResponse),
  );

  return actions;
}

export default async function cancelOrder(ctObj: any, mollieClient: MollieClient, getCancelOrderParams: Function, createCtActions: Function): Promise<CTUpdatesRequestedResponse> {
  try {
    const cancelOrderParams = await getCancelOrderParams(ctObj);
    const mollieCancelOrderRes = cancelOrderParams.lines?.length ? await mollieClient.orders_lines.cancel(cancelOrderParams) : await mollieClient.orders.cancel(ctObj.key);
    Logger.debug(mollieCancelOrderRes);
    const ctActions = createCtActions(mollieCancelOrderRes, ctObj);
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
