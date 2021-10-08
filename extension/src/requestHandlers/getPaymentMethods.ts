import { MollieClient, List, Method } from '@mollie/api-client';
import { CTActionResponse } from '../types';
import { createDateNowString, methodListMapper } from '../utils';

export default async function getPaymentMethods(ctObj: any, mollieClient: MollieClient) {
  try {
    const mollieOptions = methodListMapper(ctObj)
    const methods: List<Method> = await mollieClient.methods.all(mollieOptions);
    const availablePaymentMethods: string = methods.length > 0 ? JSON.stringify(methods) : 'NO_AVAILABLE_PAYMENT_METHODS';
    const ctResponse: CTActionResponse = {
      actions: [
        {
          action: 'addInterfaceInteraction',
          type: {
            key: 'ct-mollie-integration-interface-interaction-type',
          },
          fields: {
            actionType: 'getPaymentMethods',
            request: JSON.stringify(ctObj?.custom?.fields?.paymentMethodsRequest),
            response: availablePaymentMethods,
            createdAt: createDateNowString(),
          },
        },
        {
          action: 'setCustomField',
          name: 'paymentMethodsResponse',
          value: availablePaymentMethods,
        },
      ],
    };
    return ctResponse;
  } catch (error: any) {
    console.warn(error);
    return error;
  }
}
