import { MollieClient, PaymentMethod, OrderCreateParams, Order, OrderEmbed, OrderLineType, Payment } from '@mollie/api-client';
import { OrderAddress } from '@mollie/api-client/dist/types/src/data/orders/data';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import { Action, CTTransactionType, CTUpdatesRequestedResponse } from '../types';
import { convertCTToMollieAmountValue, createDateNowString } from '../utils';
import Logger from '../logger/logger';

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

/**
 *
 * @param paymentMethods comma separated string of valid mollie PaymentMethods
 * If no valid payment methods are provided, this will return '' and
 * the 'method' parameter will not be passed as part of the createOrder request
 *
 * The PaymentMethod enum is currently missing 'voucher' & 'mybank'. These will be added
 * in V3.6 or V4 of the mollie node SDK.
 *
 * Until then, we cast 'voucher'/'mybank' as PaymentMethod and track this in Issue #34
 * https://github.com/mollie/commercetools/issues/34
 */
export const formatPaymentMethods = (paymentMethods: string | undefined): PaymentMethod[] | PaymentMethod | '' => {
  if (paymentMethods) {
    const methods = paymentMethods.split(',');
    const methodArray = methods
      .map(method => {
        if (method === 'voucher' || method === 'mybank') {
          return method as PaymentMethod;
        }
        return PaymentMethod[method as PaymentMethod];
      })
      .filter(method => method !== undefined);
    if (methodArray.length <= 1) {
      return methodArray.join('') as PaymentMethod;
    }
    return methodArray;
  }
  return '';
};

function extractAllLines(lines: any) {
  let extractedLines = [];
  for (let line of lines) {
    extractedLines.push(extractLine(line));
  }
  return extractedLines;
}

export function isDiscountAmountValid(inputObject: any): boolean {
  if (inputObject?.currencyCode && inputObject?.centAmount) {
    return true;
  }
  return false;
}

export function extractLine(line: any) {
  const unitPriceValueString = convertCTToMollieAmountValue(line.price.value.centAmount, line.price.value.fractionDigits);
  const extractedLine: any = {
    // Name as english for the time being
    name: line.name.en,
    quantity: line.quantity,
    unitPrice: {
      currency: line.price.value.currencyCode,
      value: unitPriceValueString,
    },
    vatRate: convertCTTaxRateToMollieTaxRate(line.vatRate),
    vatAmount: {
      currency: line.vatAmount.currencyCode,
      value: convertCTToMollieAmountValue(line.vatAmount.centAmount),
    },
    type: line.type in OrderLineType ? OrderLineType[line.type as keyof typeof OrderLineType] : ('' as OrderLineType),
    category: line.category in MollieLineCategoryType ? MollieLineCategoryType[line.category as keyof typeof MollieLineCategoryType] : ('' as MollieLineCategoryType),
    sku: line.sku ? line.sku : '',
    imageUrl: line.imageUrl ? line.imageUrl : '',
    productUrl: line.productUrl ? line.productUrl : '',
    metadata: line.metadata ? line.metadata : {},
  };

  // Handle discounts
  let discountCentAmount = 0;
  if (line.discountAmount && isDiscountAmountValid(line.discountAmount)) {
    discountCentAmount = line.discountAmount.centAmount;
    extractedLine.discountAmount = {
      currency: line.discountAmount.currencyCode,
      value: convertCTToMollieAmountValue(line.discountAmount.centAmount),
    };
  }

  // Calculate total line price
  const totalPriceCT = line.price.value.centAmount * line.quantity - discountCentAmount;
  const totalAmountMollieString = convertCTToMollieAmountValue(totalPriceCT, line?.price?.value?.fractionDigits);
  extractedLine.totalAmount = {
    currency: line.price.value.currencyCode,
    value: totalAmountMollieString,
  };

  return extractedLine;
}

export function fillOrderValues(ctObj: any): Promise<OrderCreateParams> {
  try {
    const deStringedOrderRequest = JSON.parse(ctObj.custom?.fields?.createOrderRequest);
    const amountConverted = convertCTToMollieAmountValue(ctObj.amountPlanned?.centAmount);
    const orderValues: OrderCreateParams = {
      amount: {
        value: amountConverted,
        currency: ctObj.amountPlanned?.currencyCode,
      },
      orderNumber: deStringedOrderRequest.orderNumber.toString(),
      webhookUrl: deStringedOrderRequest.orderWebhookUrl,
      locale: deStringedOrderRequest.locale,
      redirectUrl: deStringedOrderRequest.redirectUrl,
      shopperCountryMustMatchBillingCountry: deStringedOrderRequest.shopperCountryMustMatchBillingCountry || false,
      expiresAt: deStringedOrderRequest.expiresAt || '',
      billingAddress: getBillingAddress(deStringedOrderRequest.billingAddress),
      lines: extractAllLines(deStringedOrderRequest.lines),
      metadata: deStringedOrderRequest.metadata || {},
      embed: [OrderEmbed.payments],
      payment: {
        webhookUrl: deStringedOrderRequest.orderWebhookUrl,
      },
    };
    if (deStringedOrderRequest.shippingAddress) {
      orderValues.shippingAddress = getShippingAddress(deStringedOrderRequest.shippingAddress);
    }
    const formattedMethods = formatPaymentMethods(ctObj.paymentMethodInfo?.method);
    if (formattedMethods) {
      orderValues.method = formattedMethods;
    }
    return Promise.resolve(orderValues);
  } catch (error) {
    Logger.error({ error });
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
        type: CTTransactionType.Charge,
        amount: ctObj.amountPlanned,
        interactionId: molliePaymentId,
      },
    },
  ];
  return Promise.resolve(result);
}

export default async function createOrder(ctObj: any, mollieClient: MollieClient, commercetoolsClient: any): Promise<CTUpdatesRequestedResponse> {
  const paymentId = ctObj?.id
  const { commercetoolsApi, projectKey } = commercetoolsClient
  try {
    const getCartByPaymentOptions = {
      uri: `/${projectKey}/carts?where=paymentInfo(payments(id%3D%22${paymentId}%22))`,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };
    const cartByPayment = await commercetoolsApi.execute(getCartByPaymentOptions);
    console.log('cartByPayment', cartByPayment.body.results[0])

    const orderParams = await fillOrderValues(ctObj);
    const mollieCreatedOrder = await mollieClient.orders.create(orderParams);
    const ctActions = await createCtActions(mollieCreatedOrder, ctObj);
    return {
      actions: ctActions,
      status: 201,
    };
  } catch (error: any) {
    Logger.error({ error });
    const errorResponse = formatMollieErrorResponse(error);
    return errorResponse;
  }
}
