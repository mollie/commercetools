import { MollieClient } from '@mollie/api-client';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import { CTUpdatesRequestedResponse } from '../types';

export default async function cancelOrder(ctObj: any, mollieClient: MollieClient): Promise<CTUpdatesRequestedResponse> {
  try {
    const mollieCancelOrderRes = await mollieClient.orders.cancel(ctObj.key);
    console.log('mollieCancelOrderRes', mollieCancelOrderRes)
    return {
      actions: [],
      status: 201,
    };
  } catch (error: any) {
    console.error(error);
    const errorResponse = formatMollieErrorResponse(error);
    return errorResponse;
  }
}
