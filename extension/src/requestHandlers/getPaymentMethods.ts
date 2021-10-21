import { MollieClient, List, Method } from '@mollie/api-client';
import { CTUpdatesRequestedResponse, Action } from '../types';
import { createDateNowString, methodListMapper } from '../utils';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';

export default async function getPaymentMethods(ctObj: any, mollieClient: MollieClient): Promise<CTUpdatesRequestedResponse> {
  try {
    const mollieOptions = methodListMapper(ctObj);
    const methods: List<Method> = await mollieClient.methods.list(mollieOptions);
    const availablePaymentMethods: string = methods.length > 0 ? JSON.stringify(methods) : 'NO_AVAILABLE_PAYMENT_METHODS';
    const ctUpdateActions: Action[] = [
      {
        action: 'addInterfaceInteraction',
        type: {
          key: 'ct-mollie-integration-interface-interaction-type',
        },
        fields: {
          actionType: 'getPaymentMethods',
          request: ctObj?.custom?.fields?.paymentMethodsRequest,
          response: availablePaymentMethods,
          createdAt: createDateNowString(),
        },
      },
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
    console.warn(error);
    const errorResponse = formatMollieErrorResponse(error);
    return errorResponse;
  }
}
