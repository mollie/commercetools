import { MollieClient, PaymentMethod, OrderCreateParams, Order, OrderEmbed, OrderLineType } from '@mollie/api-client';
import { OrderAddress, OrderStatus } from '@mollie/api-client/dist/types/src/data/orders/data';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import { Action, CTUpdatesRequestedResponse } from '../types';
import { amountMapper, createDateNowString } from '../utils';

enum MollieLineCategoryType {
  meal = 'meal',
  eco = 'eco',
  gift = 'gift',
}

export function getBillingAddress(billingAddressObject: any): OrderAddress {
  return {
    givenName: billingAddressObject.firstName,
    familyName: billingAddressObject.lastName,
    email: billingAddressObject.email,
    streetAndNumber: billingAddressObject?.streetName && billingAddressObject?.streetNumber ? billingAddressObject?.streetName + ' ' + billingAddressObject?.streetNumber : '',
    city: billingAddressObject.city,
    postalCode: billingAddressObject.postalCode,
    country: billingAddressObject.country,
  };
}

export function convertCTTaxRateToMollieTaxRate(CTTaxRate: any): string {
  return (parseFloat(CTTaxRate) * 100).toFixed(2);
}

export function getShippingAddress(shippingAddressObject: any): OrderAddress {
  let rtnObject: OrderAddress = {
    givenName: shippingAddressObject.firstName || '',
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
    vatRate: convertCTTaxRateToMollieTaxRate(line.vatRate),
    vatAmount: {
      currency: line.vatAmount.currencyCode,
      value: amountMapper({ centAmount: line.vatAmount.centAmount }),
    },
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

export function fillOrderValues(body: any): Promise<OrderCreateParams> {
  try {
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
      billingAddress: getBillingAddress(deStringedOrderRequest.billingAddress),
      lines: extractAllLines(deStringedOrderRequest.lines),
      metadata: deStringedOrderRequest.metadata || {},
      embed: [OrderEmbed.payments],
    };
    if (deStringedOrderRequest.shippingAddress) {
      orderValues.shippingAddress = getShippingAddress(deStringedOrderRequest.shippingAddress);
    }
    return Promise.resolve(orderValues);
  } catch (e) {
    console.error(e);
    return Promise.reject({ status: 400, title: 'Could not make parameters needed to create Mollie order.', field: 'createOrderRequest' });
  }
}

export function createCtActions(orderResponse: Order, ctObj: any): Promise<Action[]> {
  const stringifiedMollieOrder = JSON.stringify(orderResponse);
  const molliePaymentId = orderResponse._embedded?.payments?.[0].id;
  if (!molliePaymentId) {
    // This should theoretically never happen
    return Promise.reject({ status: 400, title: 'Could not get Mollie payment id.', field: '<MollieOrder>._embedded.payments.[0].id' });
  }
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
      action: 'addTransaction',
      transaction: {
        timestamp: orderResponse.createdAt,
        type: 'Charge',
        amount: ctObj.amountPlanned,
        interactionId: molliePaymentId,
      },
    },
  ];
  return Promise.resolve(result);
}

export default async function createOrder(body: any, mollieClient: MollieClient): Promise<CTUpdatesRequestedResponse> {
  try {
    // TODO: refactor to not pass the whole body..
    const orderParams = await fillOrderValues(body);
    const mollieCreatedOrder = await mollieClient.orders.create(orderParams);
    const ctActions = await createCtActions(mollieCreatedOrder, body?.resource?.obj);
    return {
      actions: ctActions,
      status: 201,
    };
  } catch (error: any) {
    console.error(error);
    const errorResponse = formatMollieErrorResponse(error);
    return errorResponse;
  }
}
