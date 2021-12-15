import { MollieClient, PaymentMethod, OrderCreateParams, Order, OrderEmbed, OrderLine } from '@mollie/api-client';
import { OrderAddress } from '@mollie/api-client/dist/types/src/data/orders/data';
import formatErrorResponse from '../errorHandlers/';
import { Action, CTCart, CTLineItem, CTPayment, CTTransactionType, CTUpdatesRequestedResponse } from '../types';
import { createDateNowString, makeMollieAmount } from '../utils';
import Logger from '../logger/logger';
import config from '../../config/config';

const {
  commercetools: { projectKey },
  service: { webhookUrl, locale, redirectUrl },
} = config;

export function makeMollieAddress(ctAddress: any): OrderAddress {
  let mollieAddress: OrderAddress = {
    givenName: ctAddress.firstName,
    familyName: ctAddress.lastName,
    email: ctAddress.email,
    streetAndNumber: ctAddress.streetName && ctAddress.streetNumber ? `${ctAddress.streetName} ${ctAddress.streetNumber}` : '',
    city: ctAddress.city,
    postalCode: ctAddress.postalCode,
    country: ctAddress.country,
  };
  return mollieAddress;
}

export function makeMollieLine(line: CTLineItem): OrderLine {
  const extractedLine = {
    // Name as english for the time being
    name: line.name['en-US'],
    quantity: line.quantity,
    sku: line.variant.sku,
    unitPrice: makeMollieAmount(line.price.value),
    vatRate: (line.taxRate.amount * 100).toFixed(2),
    totalAmount: makeMollieAmount(line.totalPrice),
    vatAmount: makeMollieAmount({ ...line.taxedPrice.totalGross, centAmount: line.taxedPrice.totalGross.centAmount - line.taxedPrice.totalNet.centAmount }),
    metadata: {
      cartLineItemId: line.id,
    },
  };
  // Handle discounts
  if (line.price.discounted?.value || line.discountedPrice?.value) {
    const discountCentAmount = line.price.value.centAmount * line.quantity - line.totalPrice.centAmount;
    Object.assign(extractedLine, { discountAmount: makeMollieAmount({ ...line.taxedPrice.totalGross, centAmount: discountCentAmount }) });
  }
  return extractedLine as OrderLine;
}

export function getCreateOrderParams(ctPayment: CTPayment, cart: CTCart): Promise<OrderCreateParams> {
  if (!ctPayment.custom?.fields?.createPayment) {
    return Promise.reject({ status: 400, title: 'createPayment field is required to create Mollie order.', field: 'createPayment' });
  }
  if (!cart.billingAddress) {
    return Promise.reject({ status: 400, title: 'Cart associated with this payment is missing billingAddress', field: 'cart.billingAddress' });
  }
  try {
    const parsedCtPayment = JSON.parse(ctPayment.custom?.fields?.createPayment);
    const orderParams: OrderCreateParams = {
      amount: makeMollieAmount(ctPayment.amountPlanned),
      orderNumber: ctPayment.id,
      lines: (cart.lineItems ?? []).map((l: CTLineItem) => makeMollieLine(l)),
      locale: parsedCtPayment.locale || locale,
      billingAddress: makeMollieAddress(cart.billingAddress),
      method: ctPayment.paymentMethodInfo.method as PaymentMethod,

      webhookUrl: parsedCtPayment.webhookUrl || webhookUrl,
      embed: [OrderEmbed.payments],
      payment: {
        webhookUrl: parsedCtPayment.webhookUrl || webhookUrl,
      },

      redirectUrl: parsedCtPayment.redirectUrl || redirectUrl,
      expiresAt: parsedCtPayment.expiresAt || '',
      metadata: { cartId: cart.id },
    };
    if (cart.shippingAddress) {
      orderParams.shippingAddress = makeMollieAddress(cart.shippingAddress);
    }

    // TODO: Category for mollie is required on one of line items when using voucher. This feature is not supported atm
    // if (orderParams.method === 'voucher') {
    //   orderParams.lines.map(l => l.category = 'eco')
    // }

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

    const orderParams = await getCreateOrderParams(ctPayment, cartByPayment.body.results[0]);
    Logger.debug({ orderParams });
    const mollieCreatedOrder = await mollieClient.orders.create(orderParams);
    Logger.debug({ mollieCreatedOrder });
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
