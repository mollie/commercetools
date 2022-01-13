import { Amount } from '@mollie/api-client/dist/types/src/data/global';
import { CTMoney, CTTransaction, CTTransactionState, CTTransactionType } from './types';
import { isEmpty, trim } from 'lodash';
import { OrderLine, OrderLineType } from '@mollie/api-client';

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

function convertCTToMollieAmountValue(ctValue: number, fractionDigits = 2): string {
  const divider = Math.pow(10, fractionDigits);
  const mollieAmountValue = (ctValue / divider).toFixed(fractionDigits);
  return mollieAmountValue;
}

export function makeMollieAmount({ centAmount, fractionDigits, currencyCode }: CTMoney): Amount {
  return {
    value: convertCTToMollieAmountValue(centAmount, fractionDigits),
    currency: currencyCode,
  };
}

export function isMolliePaymentInterface(ctObj: any): Boolean {
  if (!ctObj.paymentMethodInfo?.paymentInterface) return false;
  const normalizedInterface = ctObj.paymentMethodInfo?.paymentInterface.toLowerCase();
  return normalizedInterface === 'mollie' ? true : false;
}

export function findInitialTransaction(transactions: CTTransaction[], type: CTTransactionType): CTTransaction | undefined {
  // Assumes one initial transaction, i.e. one capture being made at a time
  return transactions.find(tr => tr.type === type && tr.state === CTTransactionState.Initial);
}

export function isPartialTransaction(transactions: CTTransaction[], type: CTTransactionType): boolean {
  if (!transactions) return false;
  const initialCharge = findInitialTransaction(transactions, type);
  return !isEmpty(initialCharge?.custom?.fields?.lineIds) || initialCharge?.custom?.fields?.includeShipping!;
}

function tryParseJSON(jsonString: string | undefined) {
  try {
    const parsed = JSON.parse(jsonString!);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch (error) {
    return false;
  }
}

export function ctToMollieLines(ctTransaction: CTTransaction, mollieOrderLines: OrderLine[]): { id: string; quantity?: number; amount?: Amount }[] {
  const parsedOptions = tryParseJSON(ctTransaction.custom?.fields?.lineIds);
  const ctLinesArray = parsedOptions ? parsedOptions : ctTransaction.custom?.fields?.lineIds?.split(',').map(trim);

  const mollieLines = ctLinesArray.reduce((acc: Object[], ctLine: any) => {
    const ctLineId = typeof ctLine === 'string' ? ctLine : ctLine.id;
    const mollieLine = ctLineId && mollieOrderLines.find(mollieLine => mollieLine.metadata?.cartLineItemId === ctLineId || mollieLine.metadata?.cartCustomLineItemId === ctLineId);
    if (mollieLine) {
      const transformedLine = { id: mollieLine.id };
      ctLine.quantity && Object.assign(transformedLine, { quantity: ctLine.quantity });
      ctLine.totalPrice && Object.assign(transformedLine, { amount: makeMollieAmount(ctLine.totalPrice) });
      acc.push(transformedLine);
    }
    return acc;
  }, []);

  if (ctTransaction.custom?.fields?.includeShipping) {
    const shippingLine = mollieOrderLines.find(mollieLine => mollieLine.type === OrderLineType.shipping_fee);
    shippingLine && mollieLines.push({ id: shippingLine.id });
  }

  return mollieLines;
}

export function mollieToCtLines(mollieOrderLines: OrderLine[]): string {
  const ctLinesString = mollieOrderLines.reduce((acc: string, orderLine: OrderLine) => {
    const ctLineId = orderLine.metadata?.cartLineItemId || orderLine.metadata?.cartCustomLineItemId;
    if (ctLineId) acc += `${ctLineId},`;
    if (orderLine.type === OrderLineType.shipping_fee) acc += `${orderLine.name},`;
    return acc;
  }, '');

  return ctLinesString;
}
