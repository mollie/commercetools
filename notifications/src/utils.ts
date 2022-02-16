import { v4 as uuid } from 'uuid';
import { Amount } from '@mollie/api-client/dist/types/src/data/global';
import { CTMoney } from './types/ctPayment';

export const isOrderOrPayment = (resourceId: string): string => {
  const orderRegex = new RegExp('^ord_');
  const paymentRegex = new RegExp('^tr_');
  let result = '';

  switch (true) {
    case orderRegex.test(resourceId):
      result = 'order';
      break;
    case paymentRegex.test(resourceId):
      result = 'payment';
      break;
    default:
      result = 'invalid';
  }
  return result;
};

export function createCorrelationId(): string {
  return `mollie-integration-${uuid()}`
}

/**
 * Converts a Mollie payment object to a commercetools money object
 * @param mollieAmount e.g. { value: "100.00", currency: "EUR" }
 */
export function convertMollieAmountToCTMoney(mollieAmount: Amount): CTMoney {
  // Get the fraction digits (aka number of decimal places)
  const fractionDigits = mollieAmount.value.split('.')[1]?.length ?? 0;
  const convertedMollieAmountValue = parseFloat(mollieAmount.value) * Math.pow(10, fractionDigits);
  return {
    type: 'centPrecision',
    currencyCode: mollieAmount.currency,
    // If the value is negative, round down, else round up
    centAmount: convertedMollieAmountValue > 0 ? Math.ceil(convertedMollieAmountValue) : Math.floor(convertedMollieAmountValue),
    fractionDigits,
  };
}
