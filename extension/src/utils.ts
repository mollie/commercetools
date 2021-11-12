import { MethodsListParams } from '@mollie/api-client';
import { Action, ControllerAction } from './types';
/**
 * Generates an ISO string date
 * @returns {String} Returns the current date converted to ISO.
 */
export function createDateNowString() {
  return new Date().toISOString();
}

/**
 *
 * @param mollieValue e.g. "10.00"
 * @param fractionDigits defaults to 2 in commercetools
 * WIP - does not handle other values of fractionDigits yet
 */
export const convertMollieToCTPaymentAmount = (mollieValue: string, fractionDigits = 2) => {
  return Math.ceil(parseFloat(mollieValue) * Math.pow(10, fractionDigits));
};

export function convertCTToMollieAmountValue(ctValue: number, fractionDigits = 2): string {
  const divider = Math.pow(10, fractionDigits);
  const mollieAmountValue = (ctValue / divider).toFixed(2);
  return mollieAmountValue;
}

export function methodListMapper(ctObj: any): MethodsListParams {
  // Generally this shouldn't be needed, but a safety anyway.. eventually could return error here
  if (!ctObj.amountPlanned) {
    return {};
  }
  const mObject: MethodsListParams = {
    amount: {
      value: convertCTToMollieAmountValue(ctObj.amountPlanned.centAmount, ctObj.amountPlanned.fractionDigits),
      currency: ctObj.amountPlanned.currencyCode,
    },
    // Resource is hardcoded, for the time being we only support Orders API
    resource: 'orders',
  };

  if (ctObj.custom?.fields?.paymentMethodsRequest) {
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
  }

  return mObject;
}

/**
 *
 * @param customFieldName
 * @param customFieldValue
 * If the customFieldValue is an API response, JSON Stringify it before passing it
 */
const setCustomField = (customFieldName: string, customFieldValue: string) => {
  return {
    action: 'setCustomField',
    name: customFieldName,
    value: customFieldValue,
  };
};

/**
 *
 * @param actionType ControllerAction
 * @param requestValue
 * @param responseValue
 * If the responseValue is an API response, JSON Stringify it before passing it
 */
const addInterfaceInteraction = (actionType: ControllerAction, requestValue: string, responseValue: string) => {
  return {
    action: 'addInterfaceInteraction',
    type: {
      key: 'ct-mollie-integration-interface-interaction-type',
    },
    fields: {
      actionType,
      createdAt: createDateNowString(),
      request: requestValue,
      response: responseValue,
    },
  };
};

export const makeActions = {
  setCustomField,
  addInterfaceInteraction,
};
