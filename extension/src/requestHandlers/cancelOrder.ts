import { MollieClient, Order, OrderLineCancelParams } from '@mollie/api-client';
import Logger from '../logger/logger';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import { Action, ControllerAction, CTUpdatesRequestedResponse } from '../types';
import { createDateNowString } from '../utils';

export function createCtActions(mollieCancelOrderRes: Order, ctObj: any): Action[] {
  const stringifiedCancelOrderResponse = JSON.stringify(mollieCancelOrderRes);
  const result: Action[] = [
    {
      action: 'addInterfaceInteraction',
      type: {
        key: 'ct-mollie-integration-interface-interaction-type',
      },
      fields: {
        actionType: ControllerAction.CancelOrder,
        createdAt: createDateNowString(),
        request: ctObj?.custom?.fields?.cancelOrderRequest,
        response: stringifiedCancelOrderResponse,
      },
    },
    {
      action: 'setCustomField',
      name: 'createCancelOrderResponse',
      value: stringifiedCancelOrderResponse,
    },
  ];
  return result;
}

export default async function cancelOrder(ctObj: any, mollieClient: MollieClient, createCtActions: Function): Promise<CTUpdatesRequestedResponse> {
  try {
    const mollieCancelOrderRes = await mollieClient.orders.cancel(ctObj.key);
    Logger.debug(mollieCancelOrderRes);
    const ctActions = createCtActions(mollieCancelOrderRes, ctObj);
    return {
      actions: ctActions,
      status: 200,
    };
  } catch (error: any) {
    Logger.error(error);
    const errorResponse = formatMollieErrorResponse(error);
    return errorResponse;
  }
}
