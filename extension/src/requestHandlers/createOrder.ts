import { MollieClient, PaymentMethod, OrderCreateParams, Order, OrderEmbed } from '@mollie/api-client';
import { OrderAddress } from '@mollie/api-client/dist/types/src/data/orders/data';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import { Action, CTUpdatesRequestedResponse } from '../types';
import { amountMapper, createDateNowString } from '../utils';

export function getBillingAddress(billingAddressObject: any, method: string): OrderAddress {
  let rtnObject;
  method === PaymentMethod.paypal
    ? (rtnObject = {} as OrderAddress)
    : (rtnObject = {
        givenName: billingAddressObject.firstName,
        familyName: billingAddressObject.lastName,
        email: billingAddressObject.email,
        streetAndNumber: billingAddressObject?.streetName && billingAddressObject?.streetNumber ? billingAddressObject?.streetName + ' ' + billingAddressObject?.streetNumber : '',
        city: billingAddressObject.city,
        postalCode: billingAddressObject.postalCode,
        country: billingAddressObject.country,
      });
  return rtnObject;
}

export function CTPaymentMethodToMolliePaymentMethod(CTPaymentMethod: string): PaymentMethod {
  if (!(CTPaymentMethod in PaymentMethod)) {
    return '' as PaymentMethod;
  }
  return PaymentMethod[CTPaymentMethod as keyof typeof PaymentMethod];
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
    // vatRate: calculateTaxRate(line.taxRate.amount),
    vatAmount: {
      currency: 'EUR',
      value: '0.00',
    },
    // vatAmount: calculateTaxAmount(line.taxRate.amount, line.taxedPrice.totalGross),
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
    expiresAt: deStringedOrderRequest.expiresAt || '',
    billingAddress: getBillingAddress(deStringedOrderRequest.billingAddress, body?.resource?.obj?.paymentMethodInfo?.method),
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
