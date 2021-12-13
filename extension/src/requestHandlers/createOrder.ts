import { MollieClient, PaymentMethod, OrderCreateParams, Order, OrderEmbed, OrderLineType, OrderLine } from '@mollie/api-client';
import { OrderAddress } from '@mollie/api-client/dist/types/src/data/orders/data';
import formatErrorResponse from '../errorHandlers/';
import { Action, CTCart, CTLineItem, CTPayment, CTTransactionType, CTUpdatesRequestedResponse } from '../types';
import { createDateNowString, makeMollieAmount } from '../utils';
import Logger from '../logger/logger';
import config from '../../config/config';

const {
  commercetools: { projectKey },
  service: { notificationsModuleUrl, locale, redirectUrl }
} = config;

enum MollieLineCategoryType {
  meal = 'meal',
  eco = 'eco',
  gift = 'gift',
}

export function convertCTTaxRateToMollieTaxRate(CTTaxRate: any): string {
  return (parseFloat(CTTaxRate) * 100).toFixed(2);
}

export function makeMollieAddress(ctAddress: any): OrderAddress {
  let mollieAddress: OrderAddress = {
    givenName: ctAddress?.firstName,
    familyName: ctAddress?.lastName,
    email: ctAddress?.email,
    streetAndNumber: ctAddress?.streetName && ctAddress?.streetNumber ? `${ctAddress?.streetName} ${ctAddress?.streetNumber}` : '',
    city: ctAddress?.city,
    postalCode: ctAddress?.postalCode,
    country: ctAddress?.country,
  };
  return mollieAddress;
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
export const formatPaymentMethods = (paymentMethods: string): PaymentMethod[] | PaymentMethod => {
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
};

export function isDiscountAmountValid(inputObject: any): boolean {
  if (inputObject?.currencyCode && inputObject?.centAmount) {
    return true;
  }
  return false;
}

export function makeMollieLine(line: CTLineItem): OrderLine {
  // const unitPriceValueString = convertCTToMollieAmountValue(line.price.value.centAmount, line.price.value.fractionDigits);
  // const extractedLine: OrderLine = {
  //   // Name as english for the time being
  //   name: line.name.en,
  //   quantity: line.quantity,
  //   unitPrice: makeMollieAmount(line.totalPrice)
  //   // unitPrice: {
  //   //   currency: line.price.value.currencyCode,
  //   //   value: unitPriceValueString,
  //   // },
  //   vatRate: convertCTTaxRateToMollieTaxRate(line.vatRate),
  //   vatAmount: {
  //     currency: line.vatAmount.currencyCode,
  //     value: convertCTToMollieAmountValue(line.vatAmount.centAmount),
  //   },
  //   type: line.type in OrderLineType ? OrderLineType[line.type as keyof typeof OrderLineType] : ('' as OrderLineType),
  //   category: line.category in MollieLineCategoryType ? MollieLineCategoryType[line.category as keyof typeof MollieLineCategoryType] : ('' as MollieLineCategoryType),
  //   sku: line.sku ? line.sku : '',
  //   imageUrl: line.imageUrl ? line.imageUrl : '',
  //   productUrl: line.productUrl ? line.productUrl : '',
  //   metadata: line.metadata ? line.metadata : {},
  // };

  // // Handle discounts
  // let discountCentAmount = 0;
  // if (line.discountAmount && isDiscountAmountValid(line.discountAmount)) {
  //   discountCentAmount = line.discountAmount.centAmount;
  //   extractedLine.discountAmount = {
  //     currency: line.discountAmount.currencyCode,
  //     value: convertCTToMollieAmountValue(line.discountAmount.centAmount),
  //   };
  // }

  // // Calculate total line price
  // const totalPriceCT = line.price.value.centAmount * line.quantity - discountCentAmount;
  // const totalAmountMollieString = convertCTToMollieAmountValue(totalPriceCT, line?.price?.value?.fractionDigits);
  // extractedLine.totalAmount = {
  //   currency: line.price.value.currencyCode,
  //   value: totalAmountMollieString,
  // };

  // return extractedLine;
  return {} as OrderLine
}

export function getCreateOrderParams(ctPayment: CTPayment, cart: CTCart): Promise<OrderCreateParams> {
  if (!ctPayment.custom?.fields?.createPayment) {
    return Promise.reject({ status: 400, title: 'createPayment field is required to create Mollie order.', field: 'createPayment' })
  }
  try {
    const parsedCtPayment = JSON.parse(ctPayment.custom?.fields?.createPayment);
    const orderParams: OrderCreateParams = {
      amount: makeMollieAmount(ctPayment.amountPlanned),
      orderNumber: ctPayment.id,
      lines: (cart.lineItems ?? []).map((l: CTLineItem) => makeMollieLine(l)),
      locale: parsedCtPayment.locale || locale,
      billingAddress: makeMollieAddress(cart.billingAddress),
      method: formatPaymentMethods(ctPayment.paymentMethodInfo.method),

      webhookUrl: parsedCtPayment.webhookUrl || notificationsModuleUrl,
      embed: [OrderEmbed.payments],
      payment: {
        webhookUrl: parsedCtPayment.webhookUrl || notificationsModuleUrl,
      },

      redirectUrl: parsedCtPayment.redirectUrl || redirectUrl,
      expiresAt: parsedCtPayment.expiresAt || '',
      metadata: parsedCtPayment.metadata || {},
    };
    if (cart.shippingAddress) {
      orderParams.shippingAddress = makeMollieAddress(cart.shippingAddress);
    }

    return Promise.resolve(orderParams);
  } catch (error) {
    Logger.error({ error });
    return Promise.reject({ status: 400, title: 'Could not make parameters needed to create Mollie order.', field: 'createPayment' });
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

export default async function createOrder(ctPayment: CTPayment, mollieClient: MollieClient, commercetoolsClient: any): Promise<CTUpdatesRequestedResponse> {
  const paymentId = ctPayment?.id;
  try {
    const getCartByPaymentOptions = {
      uri: `/${projectKey}/carts?where=paymentInfo(payments(id%3D%22${paymentId}%22))`,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };
    const cartByPayment = await commercetoolsClient.execute(getCartByPaymentOptions);
    if (!cartByPayment.body.results.length) {
      const error = formatErrorResponse({ status: 404, message: `Could not find Cart associated with the payment ${paymentId}.` });
      return error;
    }
    console.log('cartByPayment', cartByPayment.body.results[0]);

    const orderParams = await getCreateOrderParams(ctPayment, cartByPayment.body.results[0]);
    const mollieCreatedOrder = await mollieClient.orders.create(orderParams);
    const ctActions = await createCtActions(mollieCreatedOrder, ctPayment);
    return {
      actions: ctActions,
      status: 201,
    };
  } catch (error: any) {
    Logger.error({ error });
    const errorResponse = formatErrorResponse(error);
    return errorResponse;
  }
}
