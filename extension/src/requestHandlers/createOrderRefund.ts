import { MollieClient } from '@mollie/api-client';
import { CreateParameters } from '@mollie/api-client/dist/types/src/resources/refunds/orders/parameters';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import Logger from '../logger/logger';
import { Action, ControllerAction, CTUpdatesRequestedResponse } from '../types';
import { convertMollieToCTPaymentAmount, createDateNowString } from '../utils';

export function createCtActions(mollieResponse: any, ctObj: any): Action[] {
  const stringifiedRefundResponse = JSON.parse(mollieResponse);
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
          // Convert mollie amount to ct cent amount
          centAmount: convertMollieToCTPaymentAmount(stringifiedRefundResponse.amount.value),
          currencyCode: stringifiedRefundResponse.amount.currency,
        },
        type: 'Refund',
        interactionId: stringifiedRefundResponse.orderId,
        state: 'Initial',
        timestamp: createDateNowString(),
      },
    },
  ];

  return ctActions;
}

export function getOrderRefundParams(ctObj: any): Promise<CreateParameters> {
  try {
    const parsedOrderRefundParams = JSON.parse(ctObj?.custom?.fields?.createOrderRefundRequest);
    const orderRefundParams = {
      orderId: ctObj?.key,
      // TODO: Individual order line refunds, CMI 16 & CMI 89
      lines: [],
      description: parsedOrderRefundParams.description || '',
      metadata: parsedOrderRefundParams.metadata || {},
    };
    return Promise.resolve(orderRefundParams);
  } catch (err) {
    Logger.error(err);
    return Promise.reject({ status: 400, title: 'Could not make parameters needed to create Mollie order refund payment.', field: 'createOrderRefundRequest' });
  }
}

export default async function createOrderRefund(ctObj: any, mollieClient: MollieClient): Promise<CTUpdatesRequestedResponse> {
  try {
    const orderRefundParams = await getOrderRefundParams(ctObj);
    const mollieCreateOrderRefundRes = await mollieClient.orders_refunds.create(orderRefundParams);
    const ctActions = createCtActions(mollieCreateOrderRefundRes, ctObj);
    return {
      actions: ctActions,
      status: 201,
    };
  } catch (err: any) {
    Logger.error(err);
    const errorResponse = formatMollieErrorResponse(err);
    return errorResponse;
  }
}
