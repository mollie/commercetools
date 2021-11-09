import { MollieClient, Refund } from '@mollie/api-client';
import { CreateParameters } from '@mollie/api-client/dist/types/src/resources/payments/refunds/parameters';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import Logger from '../logger/logger';
import { CTUpdatesRequestedResponse } from '../types';

export async function createSetAmountRefund(ctObject: any, mollieClient: MollieClient, params: any): Promise<CTUpdatesRequestedResponse> {
  try {
    return {
      status: 201,
      actions: [],
    };
  } catch (error) {
    Logger.error(error);
    const errorResponse = formatMollieErrorResponse(error);
    return errorResponse;
  }
}
