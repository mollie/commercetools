import { v4 as uuid } from 'uuid';
import { MollieClient, PaymentMethod, OrderCreateParams, Order, OrderEmbed, OrderLine } from '@mollie/api-client';
import { OrderAddress } from '@mollie/api-client/dist/types/src/data/orders/data';
import formatErrorResponse from '../errorHandlers/';
import { Action, CTPayment, CTTransactionType, CTUpdatesRequestedResponse, ControllerAction, CTTransactionState, CTCart, CTLineItem } from '../types';
import { makeMollieAmount } from '../utils';
import Logger from '../logger/logger';
import config from '../../config/config';
import { makeActions } from '../makeActions';

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

/**
 *
 * @param name object with string key of language tag and value of a localized name
 *
 * This function uses locale, if set, to pick which name value to use. For example,
 * if locale is set to "en_US":
 *
 * First try to find a key of "en-US"
 * If not found, try to find a key of "en"
 *
 * If no matches, or locale isn't set, then default to the first key in the name object.
 */
export const extractLocalizedName = (name: { [key: string]: string }) => {
  let localizedName;
  if (locale) {
    // transform from aa_AA to aa-AA to match CT's format
    const ctFormattedLocale = locale.replace('_', '-');
    localizedName = name[ctFormattedLocale];
    if (localizedName) {
      return localizedName;
    }
    const shortFormatLocale = locale.split('_')[0];
    localizedName = name[shortFormatLocale];
    if (localizedName) {
      return localizedName;
    }
  }
  // Default to first localized string on the object
  const keys = Object.keys(name);
  localizedName = name[keys[0]];
  return localizedName;
};

export function makeMollieLine(line: CTLineItem): OrderLine {
  const extractedLine = {
    name: extractLocalizedName(line.name),
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
  // TODO can remove this check - createPayment is not required
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
    orderParams.method = PaymentMethod[ctPayment.paymentMethodInfo?.method as PaymentMethod];
    if (ctPayment.paymentMethodInfo?.issuer && orderParams.payment) orderParams.payment.issuer = ctPayment.paymentMethodInfo?.issuer;
    return Promise.resolve(orderParams);

    // TODO: Category for mollie is required on one of line items when using voucher. This feature is not supported atm
    // if (orderParams.method === 'voucher') {
    //   orderParams.lines.map(l => l.category = 'eco')
    // }
  } catch (error) {
    Logger.error({ error });
    return Promise.reject({ status: 400, title: 'Could not make parameters needed to create Mollie order.', field: 'createPayment' });
  }
}

export function createCtActions(orderResponse: Order, ctPayment: CTPayment, cartId: string): Promise<Action[]> {
  try {
    // Find the original transaction which triggered create order
    const originalTransaction = ctPayment.transactions?.find(transaction => {
      return (transaction.type === CTTransactionType.Charge || transaction.type === CTTransactionType.Authorization) && transaction.state === CTTransactionState.Initial;
    });
    if (!originalTransaction) {
      return Promise.reject({ status: 400, title: 'Cannot find original transaction', field: 'Payment.transactions' });
    }
    // TODO - remove when transaction type is updated to have ID as required
    originalTransaction.id = originalTransaction.id ?? '';

    const interfaceInteractionId = uuid();
    const molliePaymentId = orderResponse._embedded?.payments?.[0].id;
    const mollieCreatedAt = orderResponse.createdAt;

    if (!molliePaymentId) {
      // This should theoretically never happen
      return Promise.reject({ status: 400, title: 'Could not get Mollie payment id.', field: '<MollieOrder>._embedded.payments.[0].id' });
    }

    const parsedCreatePayment = ctPayment.custom?.fields?.createPayment ? JSON.parse(ctPayment.custom?.fields?.createPayment) : '';
    const interafaceInteractionRequest = {
      cartId,
      transactionId: originalTransaction.id,
      createPayment: parsedCreatePayment,
    };
    const interfaceInteractionResponse = {
      mollieOrderId: orderResponse.id,
      checkoutUrl: orderResponse._links?.checkout?.href,
      transactionId: originalTransaction.id,
    };

    const interfaceInteractionParams = {
      actionType: ControllerAction.CreateOrder,
      requestValue: JSON.stringify(interafaceInteractionRequest),
      responseValue: JSON.stringify(interfaceInteractionResponse),
      id: interfaceInteractionId,
      timestamp: mollieCreatedAt,
    };
    const result: Action[] = [
      // Add interface interaction
      makeActions.addInterfaceInteraction(interfaceInteractionParams),
      // Set status interface text
      makeActions.setStatusInterfaceText(orderResponse.status),
      // Set key
      makeActions.setKey(orderResponse.id),
      // Update transaction state
      makeActions.changeTransactionState(originalTransaction.id, CTTransactionState.Pending),
      // Update transaction interactionId
      makeActions.changeTransactionInteractionId(originalTransaction.id, molliePaymentId),
      // Update transaction timestamp
      makeActions.changeTransactionTimestamp(originalTransaction.id, mollieCreatedAt),
    ];
    return Promise.resolve(result);
  } catch (error: any) {
    return Promise.reject(error);
  }
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
    const ctActions = await createCtActions(mollieCreatedOrder, ctPayment, cartByPayment.id);
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
