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
      // TODO: Individual order line refunds, CMI 16 & CMI 89
      lines: [],
      description: parsedOrderRefundParams.description || '',
      metadata: parsedOrderRefundParams.metadata || {},
    };
    return Promise.resolve(orderRefundParams);
  } catch (error: any) {
    Logger.error({ error });
    return Promise.reject({ status: 400, title: 'Could not make parameters needed to create Mollie order refund payment.', field: 'createOrderRefundRequest' });
  }
}

export default async function createOrderRefund(ctObj: any, mollieClient: MollieClient): Promise<CTUpdatesRequestedResponse> {
  try {
    const orderRefundParams = await getOrderRefundParams(ctObj);
    const mollieCreateOrderRefundRes = await mollieClient.orders_refunds.create(orderRefundParams);
    return {
      // To add - parse mollie response into CT actions
      actions: [],
      status: 201,
    };
  } catch (error: any) {
    Logger.error({ error });
    const errorResponse = formatMollieErrorResponse(error);
    return errorResponse;
  }
}
