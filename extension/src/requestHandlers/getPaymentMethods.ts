import { MollieClient, List, Method, MethodsListParams } from '@mollie/api-client';
import { CTUpdatesRequestedResponse, Action } from '../types';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import Logger from '../logger/logger';
import { convertCTToMollieAmountValue } from '../utils';

function extractMethodListParameters(ctObj: any): MethodsListParams {
  // Generally this shouldn't be needed, but a safety anyway.. eventually could return error here
  if (!ctObj.amountPlanned) {
    return {};
  }
  const mObject: MethodsListParams = {
    amount: {
      value: convertCTToMollieAmountValue(parseFloat(ctObj.amountPlanned.centAmount), ctObj.amountPlanned.fractionDigits),
      currency: ctObj.amountPlanned.currencyCode,
    },
    // Resource is hardcoded, for the time being we only support Orders API
    resource: 'orders',
  };

  const parsedMethodsRequest = JSON.parse(ctObj.custom?.fields?.paymentMethodsRequest);
  const { locale, billingCountry, includeWallets, orderLineCategories, issuers, pricing, sequenceType } = parsedMethodsRequest;
  const include = issuers || pricing ? `${issuers ? 'issuers,' : ''}${pricing ? 'pricing' : ''}` : undefined;

  Object.assign(
    mObject,
    locale && { locale: locale },
    include && { include: include },
    includeWallets && { includeWallets: includeWallets },
    billingCountry && { billingCountry: billingCountry },
    sequenceType && { sequenceType: sequenceType },
    orderLineCategories && { orderLineCategories: orderLineCategories },
  );

  return mObject;
}

export default async function getPaymentMethods(ctObj: any, mollieClient: MollieClient): Promise<CTUpdatesRequestedResponse> {
  try {
    const mollieOptions = extractMethodListParameters(ctObj);
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
