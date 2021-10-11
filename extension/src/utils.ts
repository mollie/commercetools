import { MethodsListParams } from '@mollie/api-client';
/**
 * Generates an ISO string date
 * @returns {String} Returns the current date converted to ISO.
 */
export function createDateNowString() {
  return new Date().toISOString();
}

export function methodListMapper(ctObj: any): MethodsListParams {
  // Generally this shouldn't be needed, but a safety anyway.. eventually could return error here
  if (!ctObj.amountPlanned) {
    return {};
  }
  const { currencyCode, centAmount, fractionDigits } = ctObj.amountPlanned;
  const divider = Math.pow(10, fractionDigits || 2);
  const mollieAmount = (centAmount / divider).toFixed(2);

  const mObject: MethodsListParams = {
    amount: {
      value: `${mollieAmount}`,
      currency: currencyCode,
    },
    // Resource is hardcoded, for the time being we only support Orders API
    resource: 'orders',
  };

  if (ctObj.custom?.fields?.paymentMethodsRequest) {
    const { locale, billingCountry, includeWallets, orderLineCategories, issuers, pricing, sequenceType } = ctObj.custom?.fields?.paymentMethodsRequest;
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
