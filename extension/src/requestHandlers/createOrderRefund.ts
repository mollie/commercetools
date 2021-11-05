import { MollieClient } from '@mollie/api-client';
import { CreateParameters } from '@mollie/api-client/dist/types/src/resources/refunds/orders/parameters';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import Logger from '../logger/logger';
import { Action, ControllerAction, CTTransactionType, CTUpdatesRequestedResponse } from '../types';
import { convertMollieToCTPaymentAmount, createDateNowString, convertCTToMolliePayment } from '../utils';

export function createCtActions(mollieResponse: any, ctObj: any): Action[] {
  const stringifiedRefundResponse = JSON.stringify(mollieResponse);
  const ctActions: Action[] = [
    {
      action: 'addInterfaceInteraction',
      type: {
        key: 'ct-mollie-integration-interface-interaction-type',
      },
      fields: {
        actionType: ControllerAction.CreateOrderRefund,
        createdAt: mollieResponse.createdAt,
        request: ctObj?.custom?.fields?.createOrderRefundRequest,
        response: stringifiedRefundResponse,
      },
    },
    {
      action: 'setCustomField',
      name: 'createOrderRefundResponse',
      value: stringifiedRefundResponse,
    },
    {
      action: 'addTransaction',
      transaction: {
        amount: {
          centAmount: convertMollieToCTPaymentAmount(mollieResponse.amount.value),
          currencyCode: mollieResponse.amount.currency,
        },
        type: CTTransactionType.Refund,
        interactionId: mollieResponse.id,
        state: 'Initial',
        timestamp: createDateNowString(),
      },
    },
  ];

  return ctActions;
}

export function extractLinesCtToMollie(ctLines: any): any {
  const mollieLines = [];
  for (let singleCtLine of ctLines) {
    const singleMollieLine = {
      id: singleCtLine.id,
    };
    const { quantity, amount } = singleCtLine;
    if (quantity) Object.assign(singleMollieLine, { quantity });
    if (amount) {
      const amountObject = {
        value: convertCTToMolliePayment(amount.centAmount),
        currency: amount.currencyCode,
      };
      Object.assign(singleMollieLine, { amount: amountObject });
    }
    mollieLines.push(singleMollieLine);
  }
  return mollieLines;
}

export function getOrderRefundParams(ctObj: any): Promise<CreateParameters> {
  try {
    const parsedOrderRefundParams = JSON.parse(ctObj?.custom?.fields?.createOrderRefundRequest);
    const orderRefundParams = {
      orderId: ctObj?.key,
      lines: extractLinesCtToMollie(parsedOrderRefundParams.lines),
      description: parsedOrderRefundParams.description || '',
      metadata: parsedOrderRefundParams.metadata || {},
    };
    return Promise.resolve(orderRefundParams);
  } catch (error: any) {
    Logger.error({ error });
    return Promise.reject({ status: 400, title: 'Could not make parameters needed to create Mollie order refund payment.', field: 'createOrderRefundRequest' });
  }
}

export default async function createOrderRefund(ctObj: any, mollieClient: MollieClient, createCtActions: Function): Promise<CTUpdatesRequestedResponse> {
  try {
    const orderRefundParams = await getOrderRefundParams(ctObj);
    const mollieCreateOrderRefundRes = await mollieClient.orders_refunds.create(orderRefundParams);
    const ctActions = createCtActions(mollieCreateOrderRefundRes, ctObj);
    return {
      actions: ctActions,
      status: 201,
    };
  } catch (error: any) {
    Logger.error(error);
    const errorResponse = formatMollieErrorResponse(error);
    return errorResponse;
  }
}
