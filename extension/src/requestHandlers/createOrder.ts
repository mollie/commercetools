import { MollieClient, PaymentMethod, OrderCreateParams, Order, OrderEmbed } from '@mollie/api-client';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import { Action, CTUpdatesRequestedResponse } from '../types';
import { amountMapper, createDateNowString } from '../utils';

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

export function fillOrderValues(body: any): OrderCreateParams {
  const deStringedOrderRequest = JSON.parse(body?.resource?.obj?.custom?.fields?.createOrderRequest);
  const amountConverted = amountMapper({ centAmount: body?.resource?.obj?.amountPlanned?.centAmount });
  const orderValues: OrderCreateParams = {
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
    embed: [OrderEmbed.payments],
  };
  return orderValues;
}

export function createCtActions(orderResponse: Order, ctObj: any): Action[] {
  const stringifiedMollieOrder = JSON.stringify(orderResponse);
  // TODO: Double check this.. array of payments
  const molliePaymentId = orderResponse._embedded?.payments?.[0].id;
  const result: Action[] = [
    {
      action: 'addInterfaceInteraction',
      type: {
        key: 'ct-mollie-integration-interface-interaction-type',
      },
      fields: {
        actionType: 'createOrder',
        createdAt: createDateNowString(),
        request: ctObj?.custom?.fields?.createOrderRequest,
        response: JSON.stringify(orderResponse),
      },
    },
    {
      action: 'setCustomField',
      name: 'createOrderResponse',
      value: stringifiedMollieOrder,
    },
    {
      action: 'setCustomField',
      name: 'mollieOrderStatus',
      value: 'created',
    },
    {
      action: 'setKey',
      key: orderResponse.id,
    },
    {
      action: 'changeTransactionInteractionId',
      transactionId: ctObj?.transactions?.[0]?.id,
      // TODO: Is interactionId Mollie's Payment ID or Order ID?
      interactionId: molliePaymentId,
    },
  ];
  return result;
}

export default async function createOrder(body: any, mollieClient: MollieClient): Promise<CTUpdatesRequestedResponse> {
  try {
    // TODO: refactor to not pass the whole body..
    const mollieCreatedOrder = await mollieClient.orders.create(fillOrderValues(body));
    const ctActions = createCtActions(mollieCreatedOrder, body?.resource?.obj);
    return {
      actions: ctActions,
      status: 201,
    };
  } catch (error: any) {
    console.warn(error);
    const errorResponse = formatMollieErrorResponse(error);
    return errorResponse;
  }
}
