import { MollieClient, List, Method } from '@mollie/api-client';
import { Request } from 'express';
import { CTUpdatesRequestedResponse, Action, CTError } from '../types';
import { createDateNowString } from '../utils';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';

export default async function getPaymentMethods(req: Request, mollieClient: MollieClient): Promise<CTUpdatesRequestedResponse> {
  try {
    const methods: List<Method> = await mollieClient.methods.all();
    const availablePaymentMethods: string = methods.length > 0 ? JSON.stringify(methods) : 'NO_AVAILABLE_PAYMENT_METHODS';
    const ctUpdateActions: Action[] = [
      {
        action: 'addInterfaceInteraction',
        type: {
          key: 'ct-mollie-integration-interface-interaction-type',
        },
        fields: {
          actionType: 'getPaymentMethods',
          request: JSON.stringify(req.body?.custom?.fields?.paymentMethodsRequest),
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
    } as CTUpdatesRequestedResponse;
  } catch (error: any) {
    const errorResponse = formatMollieErrorResponse(error);
    // for all scenarios, log the error
    console.warn(error);
    return errorResponse;
  }
}
