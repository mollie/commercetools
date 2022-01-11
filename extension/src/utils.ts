import { Amount } from '@mollie/api-client/dist/types/src/data/global';
import { CTMoney, CTTransaction, CTTransactionState, CTTransactionType } from './types';
import { isEmpty } from 'lodash';

/**
 * Generates an ISO string date
 * @returns Returns the current date converted to ISO.
 */
export function createDateNowString(): string {
  return new Date().toISOString();
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

export function convertCTToMollieAmountValue(ctValue: number, fractionDigits = 2): string {
  const divider = Math.pow(10, fractionDigits);
  const mollieAmountValue = (ctValue / divider).toFixed(2);
  return mollieAmountValue;
}

export function makeMollieAmount({ centAmount, fractionDigits, currencyCode }: CTMoney): Amount {
  return {
    value: convertCTToMollieAmountValue(centAmount, fractionDigits),
    currency: currencyCode,
  };
}

export function makeMollieLineAmounts(ctLines: any) {
  return ctLines.map((line: any) => {
    if (line.amount) {
      line.amount = makeMollieAmount(line.amount);
    }
    return line;
  });
}

export function isMolliePaymentInterface(ctObj: any): Boolean {
  if (!ctObj.paymentMethodInfo?.paymentInterface) return false;
  const normalizedInterface = ctObj.paymentMethodInfo?.paymentInterface.toLowerCase();
  return normalizedInterface === 'mollie' ? true : false;
}

export function findInitialCharge(transactions: CTTransaction[]): CTTransaction | undefined {
  // Assumes one initial transaction, i.e. one capture being made at a time
  return transactions.find(tr => tr.type === CTTransactionType.Charge && tr.state === CTTransactionState.Initial);
}

export function isPartialCapture(transactions: CTTransaction[]): boolean {
  if (!transactions) return false;
  const initialCharge = findInitialCharge(transactions);
  return !isEmpty(initialCharge?.custom?.fields?.lineIds) || initialCharge?.custom?.fields?.includeShipping!;
}