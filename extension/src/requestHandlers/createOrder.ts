import { MollieClient, PaymentMethod } from '@mollie/api-client';
import { CreateParameters } from '@mollie/api-client/dist/types/src/resources/orders/parameters';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import { CTUpdatesRequestedResponse } from '../types';
import { amountMapper } from '../utils';

function CTPaymentMethodToMolliePaymentMethod(CTPaymentMethod: string): PaymentMethod {
  // to complete - convert ct payment method list to mollie payment methods
  // mollie methods allowed:
  // applepay bancontact banktransfer belfius creditcard directdebit eps giftcard giropay ideal kbc klarnapaylater klarnasliceit mybank paypal paysafecard przelewy24 sofort voucher
  let molliePaymentMethod: PaymentMethod;
  if (CTPaymentMethod == 'CREDIT_CARD') {
    return PaymentMethod.creditcard;
  }
  return PaymentMethod.ideal;
}

function calculateTaxRate(totalPrice: string, taxRate: string): string {
  const taxRateString = (parseInt(totalPrice) * parseInt(taxRate)).toString();
  return taxRateString;
}

function extractAllLines(lines: any) {
  let extractedLines = [];
  for (let line of lines) {
    extractedLines.push(extractLine(line));
  }
  return extractedLines;
}

export function extractLine(line: any) {
  const extractedLine = {
    // Name as english for the time being
    name: line.name.en,
    quantity: line.quantity,
    unitPrice: {
      currency: line.price.value.currencyCode,
      value: amountMapper({ centAmount: line.price.value.centAmount }),
    },
    totalAmount: {
      currency: line.totalPrice.currencyCode,
      value: amountMapper({ centAmount: line.totalPrice.centAmount }),
    },
    // to finish - tax rate
    vatRate: '00.00',
    vatAmount: {
      currency: 'EUR',
      // value: calculateTaxRate(amountMapper({line.totalPrice.centAmount), line.taxRate})
      value: '0.00',
    },
    // vatRate: line.taxRate,
    // vatAmount: {
    //     currency: line.vatAmount.currency,
    //     value: calculateTaxRate(totalAmountCurrency, line.taxRate)
    // }
  };
  return extractedLine;
}

export function fillOrderValues(body: any): CreateParameters {
  const deStringedOrderRequest = JSON.parse(body?.resource?.obj?.custom?.fields?.createOrderRequest);
  const amountConverted = amountMapper({ centAmount: body?.resource?.obj?.amountPlanned?.centAmount });
  const orderValues: CreateParameters = {
    amount: {
      value: amountConverted,
      currency: body?.resource?.obj?.amountPlanned?.currencyCode,
    },
    orderNumber: deStringedOrderRequest.orderNumber.toString(),
    webhookUrl: deStringedOrderRequest.orderWebhookUrl,
    locale: deStringedOrderRequest.locale,
    redirectUrl: deStringedOrderRequest.redirectUrl,
    shopperCountryMustMatchBillingCountry: deStringedOrderRequest.shopperCountryMustMatchBillingCountry || false,
    method: CTPaymentMethodToMolliePaymentMethod(body?.resource?.obj?.paymentMethodInfo?.method),
    // To complete - expiry time
    expiresAt: body?.custom?.expiresAt || '',
    // To add - billing address
    billingAddress: {
      streetAndNumber: 'Keizersgracht 126',
      city: 'Amsterdam',
      postalCode: '1234AB',
      country: 'NL',
      givenName: 'Piet',
      familyName: 'Mondriaan',
      email: 'piet@mondriaan.com',
    },
    lines: extractAllLines(deStringedOrderRequest.lines),
  };
  return orderValues;
}

export default async function createOrder(body: any, mollieClient: MollieClient): Promise<CTUpdatesRequestedResponse> {
  try {
    const mollieCreatedOrder = await mollieClient.orders.create(fillOrderValues(body));
    return {
      actions: [],
      status: 201,
    } as CTUpdatesRequestedResponse;
  } catch (error: any) {
    console.warn(error);
    const errorResponse = formatMollieErrorResponse(error);
    return errorResponse;
  }
}
