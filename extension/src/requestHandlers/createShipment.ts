import { MollieClient, ShipmentCreateParams, Shipment, Order, OrderLine, OrderLineType } from '@mollie/api-client';
import { v4 as uuid } from 'uuid';
import formatErrorResponse from '../errorHandlers';
import { Action, ControllerAction, CTPayment, CTTransactionState, CTTransactionType, CTUpdatesRequestedResponse } from '../types';
import Logger from '../../src/logger/logger';
import { makeActions } from '../makeActions';
import { ctToMollieLines, findInitialTransaction, isPartialTransaction, ctToMollieOrderId } from '../utils';

export function getShipmentParams(ctPayment: Required<CTPayment>, mollieOrder: Order | undefined): Promise<ShipmentCreateParams> {
  Logger.debug('getShipmentParams : ctPayment : ' + JSON.stringify(ctPayment));
  Logger.debug('getShipmentParams : mollieOrder : ' + JSON.stringify(mollieOrder));

  try {
    let mollieOrderId = ctToMollieOrderId(ctPayment.key);
    const shipmentParams: ShipmentCreateParams = {
      orderId: mollieOrderId,
    };
    if (isPartialTransaction(ctPayment.transactions, CTTransactionType.Charge) && mollieOrder) {
      const initialCharge = findInitialTransaction(ctPayment.transactions, CTTransactionType.Charge);
      const mollieLines = ctToMollieLines(initialCharge!, mollieOrder.lines);
      Object.assign(shipmentParams, { lines: mollieLines });
    }
    Logger.debug('shipmentParams: %o', shipmentParams);
    return Promise.resolve(shipmentParams);
  } catch (error) {
    Logger.error({ error });
    return Promise.reject({ status: 400, title: 'Could not make parameters needed to create Mollie shipment.', field: 'createShipmentRequest' });
  }
}

export function mollieToCtLines(mollieOrderLines: OrderLine[]): string {
  const ctLinesString = mollieOrderLines.reduce((acc: string, orderLine: OrderLine) => {
    const ctLineId = orderLine.metadata?.cartLineItemId || orderLine.metadata?.cartCustomLineItemId;
    if (ctLineId) acc += `${ctLineId},`;
    if (orderLine.type === OrderLineType.shipping_fee) acc += `${orderLine.name},`;
    return acc;
  }, '');

  return ctLinesString;
}

export function createCtActions(mollieShipmentRes: Shipment, ctPayment: CTPayment): Action[] {
  const initialChargeTransaction = findInitialTransaction(ctPayment.transactions!, CTTransactionType.Charge);
  const inTransactionId = initialChargeTransaction!.id || '';
  const mollieCreatedAt = mollieShipmentRes.createdAt;
  const interfaceInteractionId = uuid();
  const interfaceInteractionRequest = {
    transactionId: inTransactionId,
    createShipment: initialChargeTransaction?.custom?.fields,
  };
  const interfaceInteractionResponse = {
    mollieShipmentId: mollieShipmentRes.id,
    lineIds: mollieToCtLines(mollieShipmentRes.lines),
  };
  const interfaceInteractionParams = {
    id: interfaceInteractionId,
    actionType: ControllerAction.CreateShipment,
    requestValue: JSON.stringify(interfaceInteractionRequest),
    responseValue: JSON.stringify(interfaceInteractionResponse),
    timestamp: mollieCreatedAt,
  };

  const result: Action[] = [
    makeActions.changeTransactionState(inTransactionId, CTTransactionState.Success),
    makeActions.changeTransactionTimestamp(inTransactionId, mollieCreatedAt),
    makeActions.changeTransactionInteractionId(inTransactionId, interfaceInteractionId),
    makeActions.setStatusInterfaceText('Shipping'),
    makeActions.addInterfaceInteraction(interfaceInteractionParams),
  ];

  return result;
}

export default async function createShipment(ctPayment: Required<CTPayment>, mollieClient: MollieClient): Promise<CTUpdatesRequestedResponse> {
  Logger.debug('createShipment : ctPayment : ' + JSON.stringify(ctPayment));
  try {
    Logger.debug('ctPayment: %o', ctPayment);
    const mollieOrderRes = isPartialTransaction(ctPayment.transactions ?? [], CTTransactionType.Charge) ? await mollieClient.orders.get(ctPayment.key) : undefined;
    const shipmentParams = await getShipmentParams(ctPayment, mollieOrderRes);
    const mollieShipmentRes = await mollieClient.orders_shipments.create(shipmentParams);
    Logger.debug('mollieShipmentRes: %o', mollieShipmentRes);
    const ctActions = createCtActions(mollieShipmentRes, ctPayment);
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
