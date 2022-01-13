import { MollieClient, Order, OrderLineCancelParams } from '@mollie/api-client';
import { v4 as uuid } from 'uuid';
import Logger from '../logger/logger';
import formatErrorResponse from '../errorHandlers';
import { Action, ControllerAction, CTPayment, CTTransactionState, CTTransactionType, CTUpdatesRequestedResponse } from '../types';
import { isPartialTransaction, findInitialTransaction, ctToMollieLines, mollieToCtLines } from '../utils';
import { makeActions } from '../makeActions';

export function getCancelOrderParams(ctPayment: Required<CTPayment>, mollieOrder: Order | undefined): Promise<OrderLineCancelParams> {
  try {
    const initialCancelAuthorization = findInitialTransaction(ctPayment.transactions, CTTransactionType.CancelAuthorization);
    const cancelOrderParams = {
      orderId: ctPayment.key,
      lines: ctToMollieLines(initialCancelAuthorization!, mollieOrder!.lines),
    };

    return Promise.resolve(cancelOrderParams);
  } catch (error) {
    Logger.error({ error });
    return Promise.reject({ status: 400, title: 'Could not make parameters required to cancel Mollie order.', field: 'createCancelOrderRequest' });
  }
}

export function createCtActions(mollieCancelOrderRes: Order | boolean, ctPayment: CTPayment): Action[] {
  const initialCancelAuthorization = findInitialTransaction(ctPayment.transactions!, CTTransactionType.CancelAuthorization);
  const initialRefund = findInitialTransaction(ctPayment.transactions!, CTTransactionType.Refund);
  const inTransactionId = initialCancelAuthorization?.id || initialRefund?.id || '';
  const interfaceInteractionId = uuid();
  const interfaceInteractionRequest = {
    transactionId: inTransactionId,
    cancelOrder: initialCancelAuthorization?.custom?.fields,
  };
  const interfaceInteractionParams = {
    id: interfaceInteractionId,
    actionType: ControllerAction.CancelOrder,
    requestValue: JSON.stringify(interfaceInteractionRequest),
    responseValue: typeof mollieCancelOrderRes === 'boolean' ? 'Ok' : JSON.stringify({ lineIds: mollieToCtLines(mollieCancelOrderRes.lines) }),
  };

  const result: Action[] = [
    makeActions.changeTransactionState(inTransactionId, CTTransactionState.Success),
    makeActions.changeTransactionTimestamp(inTransactionId),
    makeActions.changeTransactionInteractionId(inTransactionId, interfaceInteractionId),
    makeActions.addInterfaceInteraction(interfaceInteractionParams),
  ];

  return result;
}

export default async function cancelOrder(ctPayment: Required<CTPayment>, mollieClient: MollieClient, getCancelOrderParams: Function, createCtActions: Function): Promise<CTUpdatesRequestedResponse> {
  try {
    const mollieOrderRes = isPartialTransaction(ctPayment.transactions ?? [], CTTransactionType.CancelAuthorization) ? await mollieClient.orders.get(ctPayment.key) : undefined;
    const cancelOrderParams = mollieOrderRes ? await getCancelOrderParams(ctPayment, mollieOrderRes) : undefined;
    Logger.debug('cancelOrderParams: %o', cancelOrderParams);
    const mollieCancelOrderRes = cancelOrderParams ? await mollieClient.orders_lines.cancel(cancelOrderParams) : await mollieClient.orders.cancel(ctPayment.key);
    Logger.debug('mollieCancelOrderRes: %o', mollieCancelOrderRes);
    const ctActions = createCtActions(mollieCancelOrderRes, ctPayment);
    return {
      actions: ctActions,
      status: 200,
    };
  } catch (error: any) {
    Logger.error({ error });
    const errorResponse = formatErrorResponse(error);
    return errorResponse;
  }
}
