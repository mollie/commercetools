import { MollieClient, List, Method, MethodsListParams } from '@mollie/api-client';
import { CTUpdatesRequestedResponse, Action, CTPayment, CTEnumErrors } from '../types';
import formatErrorResponse from '../errorHandlers';
import Logger from '../logger/logger';
import { convertCTToMollieAmountValue } from '../utils';
import { makeActions } from '../makeActions';

function extractMethodListParameters(ctObj: CTPayment): Promise<MethodsListParams> {
  try {
    // Safety - this function should not get invoked without amountPlanned or paymentMethodsRequest
    if (!ctObj.amountPlanned || !ctObj.custom?.fields?.paymentMethodsRequest) {
      return Promise.resolve({});
    }
    const mObject: MethodsListParams = {
      amount: {
        value: convertCTToMollieAmountValue(ctObj.amountPlanned.centAmount, ctObj.amountPlanned.fractionDigits),
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

    return Promise.resolve(mObject);
  } catch (error: any) {
    return Promise.reject({ status: 400, message: error.message, title: 'Parsing error', field: 'custom.fields.paymentMethodsRequest', ctCode: CTEnumErrors.InvalidInput });
  }
}

export default async function getPaymentMethods(ctObj: CTPayment, mollieClient: MollieClient): Promise<CTUpdatesRequestedResponse> {
  try {
    const mollieOptions = await extractMethodListParameters(ctObj);
    const methods: List<Method> = await mollieClient.methods.list(mollieOptions);
    const responseMethods = JSON.stringify({
      count: methods.count,
      methods,
    });
    const availablePaymentMethods: string = methods.count > 0 ? responseMethods : JSON.stringify({ count: 0, methods: 'NO_AVAILABLE_PAYMENT_METHODS' });
    const ctUpdateActions: Action[] = [makeActions.setCustomField('paymentMethodsResponse', availablePaymentMethods)];
    return {
      actions: ctUpdateActions,
      status: 200,
    };
  } catch (error: any) {
    Logger.error(error.message);
    return formatErrorResponse(error);
  }
}
