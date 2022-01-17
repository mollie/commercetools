import { MollieClient, OrderPaymentCreateParams, Payment, PaymentMethod } from '@mollie/api-client';
import { v4 as uuid } from 'uuid';
import formatErrorResponse from '../errorHandlers';
import { Action, CTPayment, CTTransactionType, CTUpdatesRequestedResponse, CTTransactionState, ControllerAction } from '../types';
import Logger from '../logger/logger';
import { makeActions } from '../makeActions';

export function getOrdersPaymentsParams(ctPayment: CTPayment): OrderPaymentCreateParams {
  const orderPaymentCreateParams: OrderPaymentCreateParams = {
    // Payments without key create a new order in determine action
    orderId: ctPayment.key!,
    method: ctPayment.paymentMethodInfo.method as PaymentMethod,
  };
  return orderPaymentCreateParams;
}

export function createCtActions(orderPaymentRes: Payment, ctPayment: CTPayment): Promise<Action[]> {
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
    const molliePaymentId = orderPaymentRes.id;
    const mollieCreatedAt = orderPaymentRes.createdAt;

    const interafaceInteractionRequest = {
      transactionId: originalTransaction.id,
      paymentMethod: ctPayment.paymentMethodInfo.method,
    };
    const interfaceInteractionResponse = {
      molliePaymentId: orderPaymentRes.id,
      checkoutUrl: orderPaymentRes._links?.checkout?.href,
      transactionId: originalTransaction.id,
    };

    const interfaceInteractionParams = {
      actionType: ControllerAction.CreateOrderPayment,
      requestValue: JSON.stringify(interafaceInteractionRequest),
      responseValue: JSON.stringify(interfaceInteractionResponse),
      id: interfaceInteractionId,
      timestamp: mollieCreatedAt,
    };
    const result: Action[] = [
      // Add interface interaction
      makeActions.addInterfaceInteraction(interfaceInteractionParams),
      // Update transaction interactionId
      makeActions.changeTransactionInteractionId(originalTransaction.id, molliePaymentId),
      // Update transaction timestamp
      makeActions.changeTransactionTimestamp(originalTransaction.id, mollieCreatedAt),
      // Update transaction state
      makeActions.changeTransactionState(originalTransaction.id, CTTransactionState.Pending),
    ];
    return Promise.resolve(result);
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export default async function createOrderPayment(ctPayment: CTPayment, mollieClient: MollieClient, getOrdersPaymentsParams: Function, createCtActions: Function): Promise<CTUpdatesRequestedResponse> {
  try {
    const ordersPaymentsParams = getOrdersPaymentsParams(ctPayment);
    const mollieOrderPaymentRes = await mollieClient.orders_payments.create(ordersPaymentsParams);

    const ctActions = await createCtActions(mollieOrderPaymentRes, ctPayment);
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
