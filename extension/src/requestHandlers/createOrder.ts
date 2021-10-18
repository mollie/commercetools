import { MollieClient, PaymentMethod, OrderCreateParams, Order, OrderEmbed, OrderLineType, OrderLine } from '@mollie/api-client';
import { OrderAddress, OrderStatus } from '@mollie/api-client/dist/types/src/data/orders/data';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import { Action, CTUpdatesRequestedResponse } from '../types';
import { amountMapper, createDateNowString } from '../utils';

enum MollieLineCategoryType {
  meal = 'meal',
  eco = 'eco',
  gift = 'gift',
}

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

export function getShippingAddress(shippingAddressObject: any): OrderAddress {
  let rtnObject: OrderAddress = {
    givenName: shippingAddressObject.firstName,
    familyName: shippingAddressObject.lastName,
    email: shippingAddressObject.email,
    streetAndNumber: shippingAddressObject?.streetName && shippingAddressObject?.streetNumber ? shippingAddressObject?.streetName + ' ' + shippingAddressObject?.streetNumber : '',
    city: shippingAddressObject.city,
    postalCode: shippingAddressObject.postalCode,
    country: shippingAddressObject.country,
  };
  return rtnObject;
}

export function CTPaymentMethodToMolliePaymentMethod(CTPaymentMethod: string): PaymentMethod {
  if (!(CTPaymentMethod in PaymentMethod)) {
    return '' as PaymentMethod;
  }
  return PaymentMethod[CTPaymentMethod as keyof typeof PaymentMethod];
}

export function calculateTaxRate(ctTaxRateAmount: number): string {
  if (ctTaxRateAmount < 0) {
    return '';
  }
  return (ctTaxRateAmount * 100).toFixed(2);
}

export function calculateTaxAmount(ctTotalAmount: number, ctUnitAmount: number, currencyCode: string): any {
  let mollieTaxValue = (ctTotalAmount - ctUnitAmount).toFixed(2);
  let rtnObject = {
    currency: currencyCode,
    value: mollieTaxValue,
  };
  return rtnObject;
}

function extractAllLines(lines: any) {
  let extractedLines = [];
  for (let line of lines) {
    extractedLines.push(extractLine(line));
  }
  return extractedLines;
}

export function isDiscountAmountValid(inputObject: any): boolean {
  if (inputObject && inputObject.currency && inputObject.value) {
    return true;
  }
  return false;
}

export function extractLine(line: any) {
  const unitPriceValueString = amountMapper({ centAmount: line.price.value.centAmount });
  const totalPriceValueString = amountMapper({ centAmount: line.totalPrice.centAmount * line.quantity });
  const extractedLine: any = {
    // Name as english for the time being
    name: line.name.en,
    quantity: line.quantity,
    unitPrice: {
      currency: line.price.value.currencyCode,
      value: unitPriceValueString,
    },
    totalAmount: {
      currency: line.totalPrice.currencyCode,
      value: totalPriceValueString,
    },
    vatRate: calculateTaxRate(line.taxRate.amount),
    vatAmount: calculateTaxAmount(parseInt(totalPriceValueString), parseInt(unitPriceValueString), line.totalPrice.currencyCode),
    type: line.type in OrderLineType ? OrderLineType[line.type as keyof typeof OrderLineType] : ('' as OrderLineType),
    category: line.category in MollieLineCategoryType ? MollieLineCategoryType[line.category as keyof typeof MollieLineCategoryType] : ('' as MollieLineCategoryType),
    sku: line.sku ? line.sku : '',
    imageUrl: line.imageUrl ? line.imageUrl : '',
    productUrl: line.productUrl ? line.productUrl : '',
    metadata: line.metadata ? line.metadata : {},
  };
  if (line.discountAmount && isDiscountAmountValid(line.discountAmount)) {
    extractedLine.discountAmount = line.discountAmount;
  }
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
    shippingAddress: deStringedOrderRequest.shippingAddress ? getShippingAddress(deStringedOrderRequest.shippingAddress) : ({} as OrderAddress),
    lines: extractAllLines(deStringedOrderRequest.lines),
    metadata: deStringedOrderRequest.metadata || {},
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
