import { MollieClient, OrderPaymentCreateParams, Payment } from '@mollie/api-client';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import { Action, CTUpdatesRequestedResponse } from '../types';
import { createDateNowString } from '../utils';

export function getOrdersPaymentsParams(ctObj: any): Promise<OrderPaymentCreateParams> {
  try {
    const parsedCreateOrderPaymentRequest = JSON.parse(ctObj?.custom?.fields?.createOrderPaymentRequest);
    const orderPaymentCreateParams = {
      orderId: ctObj?.key,
      // method: parsedCreateOrderPaymentRequest.method,
      // customerId: ''
    };
    return Promise.resolve(orderPaymentCreateParams);
  } catch (e) {
    console.error(e);
    return Promise.reject({ status: 400, title: 'Could not make parameters needed to create Mollie order payment.', field: 'createOrderPaymentRequest' });
  }
}

export function createCtActions(orderPaymentResponse: Payment, ctObj: any): Action[] {
  const stringifiedOrderPaymentResponse = JSON.stringify(orderPaymentResponse);
  const result: Action[] = [
    {
      action: 'addInterfaceInteraction',
      type: {
        key: 'ct-mollie-integration-interface-interaction-type',
      },
      fields: {
        actionType: 'createOrderPayment',
        createdAt: createDateNowString(),
        request: ctObj?.custom?.fields?.createOrderPaymentRequest,
        response: stringifiedOrderPaymentResponse,
      },
    },
    {
      action: 'setCustomField',
      name: 'createOrderPaymentResponse',
      value: stringifiedOrderPaymentResponse,
    },
    {
      action: 'addTransaction',
      transaction: {
        timestamp: orderPaymentResponse.createdAt,
        type: 'Charge',
        amount: ctObj.amountPlanned,
        interactionId: orderPaymentResponse.id,
      },
    },
  ];
  return result;
}

export default async function createOrderPayment(ctObj: any, mollieClient: MollieClient, getOrdersPaymentsParams: Function, createCtActions: Function): Promise<CTUpdatesRequestedResponse> {
  try {
    const ordersPaymentsParams = await getOrdersPaymentsParams(ctObj);
    const mollieOrderPaymentRes = await mollieClient.orders_payments.create(ordersPaymentsParams);
    const ctActions = createCtActions(mollieOrderPaymentRes, ctObj);
    return {
      actions: ctActions,
      status: 201,
    };
  } catch (error: any) {
    console.error(error);
    const errorResponse = formatMollieErrorResponse(error);
    return errorResponse;
  }
}
