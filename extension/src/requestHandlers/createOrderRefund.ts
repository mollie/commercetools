import { MollieClient } from '@mollie/api-client';
import { CreateParameters } from '@mollie/api-client/dist/types/src/resources/refunds/orders/parameters';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import Logger from '../logger/logger';
import { CTUpdatesRequestedResponse } from '../types';

export function getOrderRefundParams(ctObj: any): Promise<CreateParameters> {
  try {
    const parsedOrderRefundParams = JSON.parse(ctObj?.custom?.fields?.createOrderRefundRequest);
    const orderRefundParams = {
      orderId: ctObj?.key,
      // To add - individual order refunds
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
    const mollieCreateOrderRefundRes = mollieClient.orders_refunds.create(orderRefundParams);
    return {
      // To add - parse mollie response into CT actions
      actions: [],
      status: 200,
    };
  } catch (err: any) {
    Logger.error(err);
    const errorResponse = formatMollieErrorResponse(err);
    return errorResponse;
  }
}
