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

export function amountMapper(amountPlanned: any): string {
  const { centAmount, fractionDigits } = amountPlanned;
  const divider = Math.pow(10, fractionDigits || 2);
  const mollieAmount = (centAmount / divider).toFixed(2);
  return mollieAmount;
}

export function methodListMapper(ctObj: any): MethodsListParams {
  // Generally this shouldn't be needed, but a safety anyway.. eventually could return error here
  if (!ctObj.amountPlanned) {
    return {};
  }
  const mollieAmount = amountMapper(ctObj.amountPlanned);

  const mObject: MethodsListParams = {
    amount: {
      value: mollieAmount,
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
 * @param ctCustomField
 * @param mollieResponse
 * Create generic update actions that are required for all journeys.
 * Each should set the custom field response and add an interfaceInteraction.
 * TODO: move to utils and use the same method across all endpoints.
 */
export const createResponseUpdateActions = (ctCustomField: string, mollieResponse: any, actionType: ControllerAction, customField: string): Action[] => {
  const actions = [
    {
      action: 'setCustomField',
      name: customField,
      value: JSON.stringify(mollieResponse),
    },
    {
      action: 'addInterfaceInteraction',
      type: {
        key: 'ct-mollie-integration-interface-interaction-type',
      },
      fields: {
        actionType,
        createdAt: createDateNowString(),
        request: ctCustomField,
        response: JSON.stringify(mollieResponse),
      },
    },
  ];
  return actions;
};
