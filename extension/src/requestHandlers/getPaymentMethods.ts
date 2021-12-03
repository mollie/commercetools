import { MollieClient, List, Method } from '@mollie/api-client';
import { CTUpdatesRequestedResponse, Action } from '../types';
import { methodListMapper } from '../utils';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import Logger from '../logger/logger';

export default async function getPaymentMethods(ctObj: any, mollieClient: MollieClient): Promise<CTUpdatesRequestedResponse> {
  try {
    const mollieOptions = methodListMapper(ctObj);
    const methods: List<Method> = await mollieClient.methods.list(mollieOptions);
    const responseMethods = JSON.stringify({
      count: methods.count,
      methods,
    });
    const availablePaymentMethods: string = methods.count > 0 ? responseMethods : JSON.stringify({ count: 0, methods: 'NO_AVAILABLE_PAYMENT_METHODS' });
    const ctUpdateActions: Action[] = [
      {
        action: 'setCustomField',
        name: 'paymentMethodsResponse',
        value: availablePaymentMethods,
      },
    ];
    return {
      actions: ctUpdateActions,
      status: 200,
    };
  } catch (error: any) {
    Logger.error({ error });
    const errorResponse = formatMollieErrorResponse(error);
    return errorResponse;
  }
}
