import { MollieClient, Order, OrderLineCancelParams } from '@mollie/api-client';
import Logger from '../logger/logger';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import { Action, ControllerAction, CTUpdatesRequestedResponse } from '../types';
import { createDateNowString, makeMollieAmount } from '../utils';

function makeMollieLineAmounts(ctLines: any) {
  return ctLines.map((line: any) => {
    if (line.amount) {
      line.amount = makeMollieAmount(line.amount);
    }
    return line;
  });
}

export function getCancelOrderParams(ctObj: any): Promise<OrderLineCancelParams> {
  try {
    const parsedCancelOrderRequest = JSON.parse(ctObj?.custom?.fields?.createCancelOrderRequest);
    const mollieAdjustedLines = makeMollieLineAmounts(parsedCancelOrderRequest);
    Logger.debug({ mollieAdjustedLines: mollieAdjustedLines });
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
  const result: Action[] = [
    {
      action: 'addInterfaceInteraction',
      type: {
        key: 'ct-mollie-integration-interface-interaction-type',
      },
      fields: {
        actionType: ControllerAction.CancelOrder,
        createdAt: createDateNowString(),
        request: ctObj?.custom?.fields?.createCancelOrderRequest,
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
    const cancelOrderParams = await getCancelOrderParams(ctObj);
    const mollieCancelOrderRes = cancelOrderParams.lines.length ? await mollieClient.orders_lines.cancel(cancelOrderParams) : await mollieClient.orders.cancel(ctObj.key);
    Logger.debug(mollieCancelOrderRes);
    const ctActions = createCtActions(mollieCancelOrderRes, ctObj);
    return {
      actions: ctActions,
      status: 200,
    };
  } catch (error: any) {
    Logger.error({ error });
    const errorResponse = formatMollieErrorResponse(error);
    return errorResponse;
  }
}
